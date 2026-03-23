import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpTimeoutException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class leitura {
    private static final String DEFAULT_BASE_URL = "https://projeto-sap.vercel.app/api/telemetry";
    private static final int DEFAULT_EXPORT_LIMIT = 5000;
    private static final int DEFAULT_IMPORT_BATCH = 50;
    private static final LinkedHashMap<String, String> EXPECTED_EVENT_PILLAR = new LinkedHashMap<>();

    static {
        EXPECTED_EVENT_PILLAR.put("TIME_TO_ACTION", "Pilar 1 - Foco Atencional");
        EXPECTED_EVENT_PILLAR.put("CLICK_ERROR", "Pilar 2 - Domínio Espacial");
        EXPECTED_EVENT_PILLAR.put("SCAFFOLDING_TRIGGERED", "Pilar 2 - Domínio Espacial");
        EXPECTED_EVENT_PILLAR.put("CHALLENGE_ATTEMPT", "Pilar 2 - Domínio Espacial");
        EXPECTED_EVENT_PILLAR.put("COMPONENT_HOVER_START", "Pilar 2 - Domínio Espacial");
        EXPECTED_EVENT_PILLAR.put("COMPONENT_HOVER_END", "Pilar 2 - Domínio Espacial");
        EXPECTED_EVENT_PILLAR.put("EXECUTION_FAILED", "Pilar 3 - Precisão Lógica");
        EXPECTED_EVENT_PILLAR.put("ASSEMBLY_CODE_ANALYSIS", "Pilar 3 - Precisão Lógica");
        EXPECTED_EVENT_PILLAR.put("HINT_EFFECTIVENESS", "Pilar 3 - Precisão Lógica");
        EXPECTED_EVENT_PILLAR.put("QUIZ_ABANDONED", "Pilar 4 - Engajamento");
        EXPECTED_EVENT_PILLAR.put("USER_LEVEL_UP", "Pilar 4 - Engajamento");
        EXPECTED_EVENT_PILLAR.put("ACHIEVEMENT_UNLOCKED", "Pilar 4 - Engajamento");
        EXPECTED_EVENT_PILLAR.put("PAGE_LOAD", "Pilar 5 - WSCAD");
        EXPECTED_EVENT_PILLAR.put("SLOW_LOAD_DETECTED", "Pilar 5 - WSCAD");
        EXPECTED_EVENT_PILLAR.put("CONNECTIVITY_CHANGE", "Pilar 5 - WSCAD");
    }

    public static void main(String[] args) throws Exception {
        Config config = Config.fromArgs(args);
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

        System.out.println("=== LEITURA TELEMETRIA ===");
        System.out.println("Base URL: " + config.baseUrl);
        System.out.println("Export limit: " + config.exportLimit);
        System.out.println("Import all: " + config.importAll);
        System.out.println("Since: " + (config.sinceIso == null ? "(none)" : config.sinceIso));
        System.out.println("Until: " + (config.untilIso == null ? "(none)" : config.untilIso));

        JsonObject health = getJson(client, config.baseUrl + "?action=health");
        System.out.println("Health status: " + stringValue(health.get("status")));
        System.out.println("Spreadsheet: " + stringValue(health.get("spreadsheet")));

        JsonObject exported = getJson(client, config.baseUrl + "?action=export&limit=" + config.exportLimit);
        String exportStatus = stringValue(exported.get("status"));
        if (!"success".equalsIgnoreCase(exportStatus)) {
            throw new IllegalStateException("Falha no export: " + toJson(exported));
        }

        JsonArray recordsRaw = asArray(exported.get("records"));
        List<JsonObject> records = new ArrayList<>();
        for (Object item : recordsRaw.values) {
            JsonObject obj = asObject(item);
            if (obj != null) records.add(obj);
        }

        int beforeFilterCount = records.size();
        records = filterRecordsByTime(records, config.sinceTs, config.untilTs);
        if (config.sinceTs != null || config.untilTs != null) {
            System.out.println("Filtro temporal aplicado: " + beforeFilterCount + " -> " + records.size() + " registros");
            if (records.isEmpty()) {
                System.out.println("Nenhum registro no intervalo informado. Ajuste --since/--until e rode novamente.");
                return;
            }
        }

        Metrics metrics = computeMetrics(records);
        printMetrics(metrics);
        printChecksumDiagnostics(records);

        if (!config.importAll) {
            System.out.println("Import desativado (--importAll=false).");
            return;
        }

        System.out.println("Importação ativada: os mesmos registros exportados serão reenviados para o endpoint (duplicados são esperados).");
        System.out.println("Iniciando importação...");
        List<JsonObject> payloadForImport = normalizeForImport(records);
        System.out.println("Registros a importar: " + payloadForImport.size());
        ImportSummary summary = importAll(client, config.baseUrl, payloadForImport, config.importBatch);
        System.out.println("Importação concluída.");
        printImportSummary(summary);
       
    }

    private static Metrics computeMetrics(List<JsonObject> records) {
        Metrics metrics = new Metrics();
        metrics.totalRecords = records.size();

        Set<String> uniqueEvents = new HashSet<>();
        for (JsonObject record : records) {
            String metricType = stringValue(record.get("metricType")).toUpperCase();
            String studentId = stringValue(record.get("studentId"));
            String sessionId = stringValue(record.get("sessionId"));
            Instant ts = parseInstant(stringValue(record.get("timestamp")));
            JsonObject ad = parseAdditionalData(record);

            String eventId = stringValue(record.get("eventId"));
            if (!eventId.isBlank()) {
                if (!uniqueEvents.add(eventId)) metrics.duplicateEventIds++;
            }

            if (!sessionId.isBlank()) metrics.uniqueSessions.add(sessionId);

            if (!studentId.isBlank()) metrics.uniqueStudents.add(studentId);

            String installation = stringValue(record.get("installationId"));
            if (!installation.isBlank()) metrics.uniqueInstallations.add(installation);

            String nickname = stringValue(record.get("nickname"));
            if (!nickname.isBlank()) metrics.uniqueNicknames.add(nickname);

            String topic = stringValue(record.get("topic"));
            if (!topic.isBlank()) metrics.byTopic.merge(topic, 1, Integer::sum);

            if (!metricType.isBlank()) metrics.byMetricType.merge(metricType, 1, Integer::sum);
            if (EXPECTED_EVENT_PILLAR.containsKey(metricType)) {
                metrics.coverageExpectedFound.merge(metricType, 1, Integer::sum);
            }

            boolean checksumValid = boolValue(record.get("checksumValid"));
            if (checksumValid) metrics.checksumValid++; else metrics.checksumInvalid++;

            String tsIso = stringValue(record.get("timestamp"));
            if (!tsIso.isBlank()) {
                metrics.minTimestamp = minIso(metrics.minTimestamp, tsIso);
                metrics.maxTimestamp = maxIso(metrics.maxTimestamp, tsIso);
            }

            if (boolValue(record.get("isRepeating"))) {
                metrics.repeatingStudents.add(studentId);
            }

            if ("TIME_TO_ACTION".equals(metricType)) {
                double tta = numberOrDefault(ad.get("value"), numberOrDefault(record.get("value"), -1));
                if (tta >= 0) {
                    metrics.ttaCount++;
                    metrics.ttaSum += tta;
                    if (boolValue(ad.get("wasCorrectTarget"))) metrics.ttaCorrectTargetCount++;
                    if (!studentId.isBlank() && !sessionId.isBlank()) {
                        SessionTta st = metrics.ttaByStudentSession.computeIfAbsent(studentId + "::" + sessionId, k -> new SessionTta());
                        st.count++;
                        st.sum += tta;
                        if (ts != null && (st.firstTs == null || ts.isBefore(st.firstTs))) st.firstTs = ts;
                    }
                }
            }

            if (isOneOf(metricType, "QUESTION_STARTED", "QUESTION_ANSWERED")) {
                double responseMs = numberOrDefault(ad.get("responseTime"), numberOrDefault(ad.get("timeMs"), -1));
                if (responseMs >= 0) {
                    metrics.ttaCount++;
                    metrics.ttaSum += responseMs;
                }
            }

            if ("SCAFFOLDING_TRIGGERED".equals(metricType)) {
                metrics.scaffoldingTriggered++;
                String hintLevel = stringValue(ad.get("hintLevel"));
                if (!hintLevel.isBlank()) metrics.scaffoldingByLevel.merge(hintLevel, 1, Integer::sum);
            }

            if (isOneOf(metricType, "CHALLENGE_ATTEMPT", "QUESTION_ANSWERED", "USER_ANSWER_RECORDED")) {
                boolean correct = boolValue(ad.get("correct"))
                        || boolValue(ad.get("isCorrect"))
                        || "CORRECT".equalsIgnoreCase(stringValue(record.get("value")))
                        || "CORRECT".equalsIgnoreCase(stringValue(ad.get("value")))
                        || "SUCCESS".equalsIgnoreCase(stringValue(record.get("value")));
                if (correct) metrics.challengeCorrect++;
            }

            if ("CLICK_ERROR".equals(metricType)) {
                String expected = stringValue(ad.get("expectedTarget"));
                String actual = stringValue(ad.get("actualTarget"));
                if (!expected.isBlank() && !actual.isBlank()) {
                    Map<String, Integer> row = metrics.spatialConfusion.computeIfAbsent(expected, k -> new HashMap<>());
                    row.merge(actual, 1, Integer::sum);
                }
            }

            if ("COMPONENT_HOVER_START".equals(metricType)) {
                String component = firstNonBlank(stringValue(ad.get("component")), stringValue(ad.get("componentId")), stringValue(ad.get("target")));
                if (ts != null && !component.isBlank()) {
                    metrics.hoverStarts.put(studentId + "::" + sessionId + "::" + component, ts);
                }
            }
            if ("COMPONENT_HOVER_END".equals(metricType)) {
                String component = firstNonBlank(stringValue(ad.get("component")), stringValue(ad.get("componentId")), stringValue(ad.get("target")));
                String key = studentId + "::" + sessionId + "::" + component;
                Instant start = metrics.hoverStarts.get(key);
                if (start != null && ts != null && !ts.isBefore(start)) {
                    long ms = Duration.between(start, ts).toMillis();
                    metrics.hoverDurationCount++;
                    metrics.hoverDurationSumMs += ms;
                    metrics.hoverStarts.remove(key);
                }
            }

            if (isOneOf(metricType, "EXECUTION_COMPLETE", "QUIZ_FINISHED")) {
                metrics.executionComplete++;
                if (!studentId.isBlank()) {
                    StudentTechPerf perf = metrics.techPerfByStudent.computeIfAbsent(studentId, k -> new StudentTechPerf());
                    perf.execComplete++;
                }
            }
            if (isOneOf(metricType, "EXECUTION_FAILED", "EXECUTION_TIMEOUT", "APP_ERROR", "JS_ERROR")) {
                metrics.executionFailed++;
                if (ad.get("finalState") != null || ad.get("stateDump") != null) {
                    metrics.executionFailedWithStateDump++;
                }
                if (!studentId.isBlank()) {
                    StudentTechPerf perf = metrics.techPerfByStudent.computeIfAbsent(studentId, k -> new StudentTechPerf());
                    perf.execFailed++;
                }
            }

            if ("ASSEMBLY_CODE_ANALYSIS".equals(metricType)) {
                metrics.assemblyAnalysisCount++;
                metrics.assemblyInstructionCountSum += numberOrDefault(ad.get("instructionCount"), 0);
                metrics.assemblyComplexitySum += numberOrDefault(ad.get("complexity"), 0);
                metrics.assemblyJumpUsageSum += numberOrDefault(ad.get("jumpCount"), numberOrDefault(ad.get("jumps"), 0));
            }

            if ("HINT_EFFECTIVENESS".equals(metricType)) {
                metrics.hintEffectivenessCount++;
                boolean success = boolValue(ad.get("success"))
                        || boolValue(ad.get("wasSuccessful"))
                        || "HELPED".equalsIgnoreCase(stringValue(record.get("value")))
                        || "SUCCESS".equalsIgnoreCase(stringValue(record.get("value")));
                if (success) metrics.hintEffectivenessSuccess++;
                double afterHintMs = numberOrDefault(ad.get("timeAfterHint"), numberOrDefault(ad.get("responseTime"), numberOrDefault(ad.get("timeMs"), -1)));
                if (afterHintMs >= 0) {
                    metrics.hintAfterResponseCount++;
                    metrics.hintAfterResponseSum += afterHintMs;
                }
            }

            if (isOneOf(metricType, "QUIZ_ABANDONED", "SESSION_ABANDONED")) {
                metrics.quizAbandonedCount++;
                String progress = stringValue(ad.get("progress"));
                if (!progress.isBlank()) metrics.quizAbandonedByProgress.merge(progress, 1, Integer::sum);
                double dur = numberOrDefault(ad.get("duration"), numberOrDefault(ad.get("sessionDuration"), -1));
                if (dur >= 0) {
                    metrics.quizAbandonedDurationCount++;
                    metrics.quizAbandonedDurationSum += dur;
                }
            }

            if ("USER_LEVEL_UP".equals(metricType) || "ACHIEVEMENT_UNLOCKED".equals(metricType)) {
                if ("USER_LEVEL_UP".equals(metricType)) metrics.userLevelUpCount++;
                if ("ACHIEVEMENT_UNLOCKED".equals(metricType)) metrics.achievementUnlockedCount++;
                if (!studentId.isBlank()) metrics.gamifiedStudents.add(studentId);
            }

            if (isOneOf(metricType, "QUIZ_COMPLETE", "QUIZ_FINISHED")) {
                double acc = numberOrDefault(ad.get("accuracy"), -1);
                if (acc < 0) acc = numberOrDefault(record.get("value"), -1);
                if (acc >= 0 && !studentId.isBlank()) {
                    StudentTechPerf perf = metrics.techPerfByStudent.computeIfAbsent(studentId, k -> new StudentTechPerf());
                    perf.quizAccuracySum += acc;
                    perf.quizAccuracyCount++;
                }
            }

            if ("USER_ANSWER_RECORDED".equals(metricType) && !studentId.isBlank()) {
                StudentTechPerf perf = metrics.techPerfByStudent.computeIfAbsent(studentId, k -> new StudentTechPerf());
                String answerValue = firstNonBlank(stringValue(ad.get("value")), stringValue(record.get("value")));
                if ("CORRECT".equalsIgnoreCase(answerValue)) {
                    perf.answerCorrectCount++;
                }
                perf.answerTotalCount++;
            }

            if ("PAGE_LOAD".equals(metricType)) {
                double loadTime = numberOrDefault(ad.get("windoLoadTime"), numberOrDefault(ad.get("loadTime"), numberOrDefault(record.get("value"), -1)));
                if (loadTime >= 0) {
                    metrics.pageLoadCount++;
                    metrics.pageLoadSum += loadTime;
                }
            }

            if ("SLOW_LOAD_DETECTED".equals(metricType)) {
                metrics.slowLoadDetectedCount++;
                double slowMs = numberOrDefault(record.get("value"), numberOrDefault(ad.get("value"), -1));
                if (slowMs >= 0) {
                    metrics.slowLoadDurationCount++;
                    metrics.slowLoadDurationSum += slowMs;
                }
            }

            if ("CONNECTIVITY_CHANGE".equals(metricType)) {
                String state = firstNonBlank(stringValue(ad.get("value")), stringValue(record.get("value")));
                if ("OFFLINE".equalsIgnoreCase(state) && !sessionId.isBlank() && ts != null) {
                    metrics.offlineEventsCount++;
                    metrics.lastOfflineTsBySession.put(sessionId, ts);
                }
            }

            if (!sessionId.isBlank() && ts != null) {
                Instant offlineTs = metrics.lastOfflineTsBySession.get(sessionId);
                if (offlineTs != null && ts.isAfter(offlineTs)) {
                    metrics.sessionsContinuedAfterOffline.add(sessionId);
                }
            }
        }

        computeFocusCurve(metrics);
        computeEngagementCorrelation(metrics);

        return metrics;
    }

    private static void printMetrics(Metrics metrics) {
        System.out.println("\n=== MÉTRICAS LIDAS ===");
        System.out.println("Total de registros: " + metrics.totalRecords);
        System.out.println("EventIds duplicados detectados no export: " + metrics.duplicateEventIds);
        System.out.println("Checksum válido: " + metrics.checksumValid);
        System.out.println("Checksum inválido: " + metrics.checksumInvalid);
        System.out.println("Sessões únicas: " + metrics.uniqueSessions.size());
        System.out.println("Students únicos: " + metrics.uniqueStudents.size());
        System.out.println("Instalações únicas: " + metrics.uniqueInstallations.size());
        System.out.println("Apelidos únicos: " + metrics.uniqueNicknames.size());
        System.out.println("Janela temporal: " + metrics.minTimestamp + " -> " + metrics.maxTimestamp);

        System.out.println("\nTop Topics:");
        printTop(metrics.byTopic, 10);

        System.out.println("\nTop Metric Types:");
        printTop(metrics.byMetricType, 15);

        printCoverage(metrics);

        System.out.println("\n=== PILAR 1: FOCO ATENCIONAL ===");
        System.out.println("TTA médio (ms): " + safeAvg(metrics.ttaSum, metrics.ttaCount));
        System.out.println("Reatividade ao destaque (% clique correto): " + safePct(metrics.ttaCorrectTargetCount, metrics.ttaCount));
        System.out.println("Curva de foco (TTA primeiras sessões, ms): " + formatDouble(metrics.focusCurveFirstAvg));
        System.out.println("Curva de foco (TTA últimas sessões, ms): " + formatDouble(metrics.focusCurveLastAvg));
        System.out.println("Curva de foco (delta últimas-primeiras, ms): " + formatDouble(metrics.focusCurveDelta));

        System.out.println("\n=== PILAR 2: DOMÍNIO ESPACIAL ===");
        System.out.println("Scaffolding Triggered: " + metrics.scaffoldingTriggered);
        System.out.println("Challenge Attempt corretos: " + metrics.challengeCorrect);
        System.out.println("Scaffolding Index (SI): " + formatDouble(safeRatio(metrics.scaffoldingTriggered, metrics.challengeCorrect)));
        System.out.println("Exploração visual média (hover ms): " + safeAvg(metrics.hoverDurationSumMs, metrics.hoverDurationCount));
        System.out.println("Top confusões espaciais (expected -> actual):");
        printTopConfusions(metrics.spatialConfusion, 10);

        System.out.println("\n=== PILAR 3: PRECISÃO LÓGICA ===");
        System.out.println("Execution Failed: " + metrics.executionFailed);
        System.out.println("Execution Failed com stateDump/finalState: " + metrics.executionFailedWithStateDump);
        System.out.println("Logical Error Density (failed / (failed+complete)): " + formatDouble(safeRatio(metrics.executionFailed, metrics.executionFailed + metrics.executionComplete)));
        System.out.println("Assembly analyses: " + metrics.assemblyAnalysisCount);
        System.out.println("Assembly avg instructionCount: " + safeAvg(metrics.assemblyInstructionCountSum, metrics.assemblyAnalysisCount));
        System.out.println("Assembly avg complexity: " + safeAvg(metrics.assemblyComplexitySum, metrics.assemblyAnalysisCount));
        System.out.println("Assembly avg jumps: " + safeAvg(metrics.assemblyJumpUsageSum, metrics.assemblyAnalysisCount));
        System.out.println("Hint effectiveness success (%): " + safePct(metrics.hintEffectivenessSuccess, metrics.hintEffectivenessCount));
        System.out.println("Hint effectiveness avg response after hint (ms): " + safeAvg(metrics.hintAfterResponseSum, metrics.hintAfterResponseCount));

        System.out.println("\n=== PILAR 4: ENGAJAMENTO E GAMIFICAÇÃO ===");
        System.out.println("Quiz Abandoned count: " + metrics.quizAbandonedCount);
        System.out.println("Quiz Abandoned avg duration (ms): " + safeAvg(metrics.quizAbandonedDurationSum, metrics.quizAbandonedDurationCount));
        System.out.println("Top progressos de abandono:");
        printTop(metrics.quizAbandonedByProgress, 8);
        System.out.println("User Level Up count: " + metrics.userLevelUpCount);
        System.out.println("Achievement Unlocked count: " + metrics.achievementUnlockedCount);
        System.out.println("Exec success rate gamificados (%): " + formatDouble(metrics.gamifiedExecSuccessRatePct));
        System.out.println("Exec success rate não-gamificados (%): " + formatDouble(metrics.nonGamifiedExecSuccessRatePct));
        System.out.println("Quiz accuracy média repetentes: " + formatDouble(metrics.repeatingAvgQuizAccuracy));
        System.out.println("Quiz accuracy média novos: " + formatDouble(metrics.newAvgQuizAccuracy));

        System.out.println("\n=== PILAR 5: VALIDAÇÃO TÉCNICA (WSCAD) ===");
        System.out.println("PAGE_LOAD avg loadTime (ms): " + safeAvg(metrics.pageLoadSum, metrics.pageLoadCount));
        System.out.println("SLOW_LOAD_DETECTED count: " + metrics.slowLoadDetectedCount);
        System.out.println("SLOW_LOAD_DETECTED avg duração (ms): " + safeAvg(metrics.slowLoadDurationSum, metrics.slowLoadDurationCount));
        System.out.println("CONNECTIVITY_CHANGE OFFLINE count: " + metrics.offlineEventsCount);
        System.out.println("Sessões que continuaram após OFFLINE: " + metrics.sessionsContinuedAfterOffline.size());
    }

    private static void computeFocusCurve(Metrics metrics) {
        Map<String, List<SessionTta>> byStudent = new HashMap<>();
        for (Map.Entry<String, SessionTta> entry : metrics.ttaByStudentSession.entrySet()) {
            String[] parts = entry.getKey().split("::", 2);
            if (parts.length < 2) continue;
            byStudent.computeIfAbsent(parts[0], k -> new ArrayList<>()).add(entry.getValue());
        }

        double firstSum = 0;
        int firstCount = 0;
        double lastSum = 0;
        int lastCount = 0;

        for (List<SessionTta> sessions : byStudent.values()) {
            sessions.sort(Comparator.comparing(s -> s.firstTs == null ? Instant.EPOCH : s.firstTs));
            if (sessions.isEmpty()) continue;
            SessionTta first = sessions.get(0);
            SessionTta last = sessions.get(sessions.size() - 1);
            if (first.count > 0) {
                firstSum += (first.sum / first.count);
                firstCount++;
            }
            if (last.count > 0) {
                lastSum += (last.sum / last.count);
                lastCount++;
            }
        }

        metrics.focusCurveFirstAvg = firstCount > 0 ? firstSum / firstCount : 0;
        metrics.focusCurveLastAvg = lastCount > 0 ? lastSum / lastCount : 0;
        metrics.focusCurveDelta = metrics.focusCurveLastAvg - metrics.focusCurveFirstAvg;
    }

    private static void computeEngagementCorrelation(Metrics metrics) {
        int gamifiedSuccess = 0;
        int gamifiedTotal = 0;
        int nonGamifiedSuccess = 0;
        int nonGamifiedTotal = 0;

        double repeatingQuizSum = 0;
        int repeatingQuizCount = 0;
        double newQuizSum = 0;
        int newQuizCount = 0;

        for (Map.Entry<String, StudentTechPerf> entry : metrics.techPerfByStudent.entrySet()) {
            String student = entry.getKey();
            StudentTechPerf perf = entry.getValue();
            boolean gamified = metrics.gamifiedStudents.contains(student);
            int totalExec = perf.execComplete + perf.execFailed;

            if (gamified) {
                gamifiedSuccess += perf.execComplete;
                gamifiedTotal += totalExec;
            } else {
                nonGamifiedSuccess += perf.execComplete;
                nonGamifiedTotal += totalExec;
            }

            if (perf.quizAccuracyCount > 0) {
                double avgAcc = perf.quizAccuracySum / perf.quizAccuracyCount;
                if (metrics.repeatingStudents.contains(student)) {
                    repeatingQuizSum += avgAcc;
                    repeatingQuizCount++;
                } else {
                    newQuizSum += avgAcc;
                    newQuizCount++;
                }
            }
        }

        metrics.gamifiedExecSuccessRatePct = safePct(gamifiedSuccess, gamifiedTotal);
        metrics.nonGamifiedExecSuccessRatePct = safePct(nonGamifiedSuccess, nonGamifiedTotal);
        metrics.repeatingAvgQuizAccuracy = repeatingQuizCount > 0 ? (repeatingQuizSum / repeatingQuizCount) : 0;
        metrics.newAvgQuizAccuracy = newQuizCount > 0 ? (newQuizSum / newQuizCount) : 0;

        if (repeatingQuizCount == 0 || newQuizCount == 0) {
            double repAnsSum = 0;
            int repAnsCount = 0;
            double newAnsSum = 0;
            int newAnsCount = 0;

            for (Map.Entry<String, StudentTechPerf> entry : metrics.techPerfByStudent.entrySet()) {
                StudentTechPerf perf = entry.getValue();
                if (perf.answerTotalCount <= 0) continue;
                double accuracy = (perf.answerCorrectCount * 100.0) / perf.answerTotalCount;
                if (metrics.repeatingStudents.contains(entry.getKey())) {
                    repAnsSum += accuracy;
                    repAnsCount++;
                } else {
                    newAnsSum += accuracy;
                    newAnsCount++;
                }
            }

            if (repeatingQuizCount == 0 && repAnsCount > 0) {
                metrics.repeatingAvgQuizAccuracy = repAnsSum / repAnsCount;
            }
            if (newQuizCount == 0 && newAnsCount > 0) {
                metrics.newAvgQuizAccuracy = newAnsSum / newAnsCount;
            }
        }
    }

    private static boolean isOneOf(String value, String... options) {
        if (value == null) return false;
        for (String option : options) {
            if (value.equalsIgnoreCase(option)) return true;
        }
        return false;
    }

    private static JsonObject parseAdditionalData(JsonObject record) {
        Object raw = record.get("additionalDataJson");
        if (raw == null) raw = record.get("additionalData");
        if (raw instanceof JsonObject obj) return obj;
        if (raw instanceof String s && !s.isBlank()) {
            try {
                Object parsed = Json.parse(s);
                return asObject(parsed) == null ? new JsonObject() : asObject(parsed);
            } catch (Exception ignored) {
                return new JsonObject();
            }
        }
        return new JsonObject();
    }

    private static Instant parseInstant(String ts) {
        if (ts == null || ts.isBlank()) return null;
        try {
            return Instant.parse(ts);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static List<JsonObject> filterRecordsByTime(List<JsonObject> records, Instant since, Instant until) {
        if (since == null && until == null) return records;
        List<JsonObject> filtered = new ArrayList<>();
        for (JsonObject record : records) {
            Instant ts = parseInstant(stringValue(record.get("timestamp")));
            if (ts == null) continue;
            if (since != null && ts.isBefore(since)) continue;
            if (until != null && ts.isAfter(until)) continue;
            filtered.add(record);
        }
        return filtered;
    }

    private static double numberOrDefault(Object value, double fallback) {
        if (value == null) return fallback;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private static double safeAvg(double sum, int count) {
        return count > 0 ? sum / count : 0;
    }

    private static double safePct(double num, double den) {
        return den > 0 ? (num * 100.0) / den : 0;
    }

    private static double safeRatio(double num, double den) {
        return den > 0 ? num / den : 0;
    }

    private static String formatDouble(double value) {
        return String.format(java.util.Locale.US, "%.3f", value);
    }

    private static void printTopConfusions(Map<String, Map<String, Integer>> confusion, int topN) {
        List<Map.Entry<String, Integer>> flat = new ArrayList<>();
        for (Map.Entry<String, Map<String, Integer>> expectedEntry : confusion.entrySet()) {
            String expected = expectedEntry.getKey();
            for (Map.Entry<String, Integer> actualEntry : expectedEntry.getValue().entrySet()) {
                flat.add(Map.entry(expected + " -> " + actualEntry.getKey(), actualEntry.getValue()));
            }
        }
        flat.stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(topN)
                .forEach(e -> System.out.println("- " + e.getKey() + ": " + e.getValue()));
    }

    private static void printCoverage(Metrics metrics) {
        System.out.println("\n=== COBERTURA DE EVENTOS (esperados x encontrados) ===");
        Map<String, Integer> missingByPillar = new LinkedHashMap<>();

        for (Map.Entry<String, String> entry : EXPECTED_EVENT_PILLAR.entrySet()) {
            String event = entry.getKey();
            String pillar = entry.getValue();
            int count = metrics.coverageExpectedFound.getOrDefault(event, 0);
            String status = count > 0 ? "OK" : "AUSENTE";
            System.out.println("- [" + status + "] " + event + " (" + pillar + "): " + count);
            if (count == 0) {
                missingByPillar.merge(pillar, 1, Integer::sum);
            }
        }

        if (!missingByPillar.isEmpty()) {
            System.out.println("\nResumo de ausência por pilar:");
            for (Map.Entry<String, Integer> entry : missingByPillar.entrySet()) {
                System.out.println("- " + entry.getKey() + ": " + entry.getValue() + " evento(s) esperado(s) ausente(s)");
            }
            System.out.println("Observação: métricas zeradas podem refletir ausência de eventos no recorte exportado, não falha no cálculo.");
        }
    }

    private static List<JsonObject> normalizeForImport(List<JsonObject> records) {
        List<JsonObject> normalized = new ArrayList<>();
        for (JsonObject row : records) {
            
            JsonObject obj = new JsonObject();
            copyIfPresent(row, obj, "eventId");
            copyIfPresent(row, obj, "timestamp");
            copyIfPresent(row, obj, "sessionId");
            copyIfPresent(row, obj, "studentId");
            copyIfPresent(row, obj, "installationId");
            copyIfPresent(row, obj, "nickname");
            copyIfPresent(row, obj, "topic");
            copyIfPresent(row, obj, "metricType");
            copyIfPresent(row, obj, "value");
            copyIfPresent(row, obj, "sequence");
            copyIfPresent(row, obj, "checksum");

            Object ad = row.get("additionalDataJson");
            if (ad == null) ad = row.get("additionalData");
            if (ad != null) obj.map.put("additionalData", ad);

            Object journey = row.get("userJourneyJson");
            if (journey != null) obj.map.put("userJourney", journey);

            if (!stringValue(obj.get("eventId")).isBlank()) {
                normalized.add(obj);
            }
        }
        return normalized;
    }

    private static void printChecksumDiagnostics(List<JsonObject> records) {
        ChecksumDiagnostics diag = new ChecksumDiagnostics();
        diag.totalRecords = records.size();

        for (JsonObject row : records) {
            boolean valid = boolValue(row.get("checksumValid"));
            if (valid) continue;
            diag.invalidRecords++;

            String sentChecksum = stringValue(row.get("checksum"));
            String rawJson = stringValue(row.get("rawJson"));
            if (rawJson.isBlank()) {
                diag.invalidWithoutRawJson++;
                continue;
            }

            JsonObject raw = null;
            try {
                raw = asObject(Json.parse(rawJson));
            } catch (Exception ignored) {
                diag.invalidRawJsonParseError++;
            }
            if (raw == null) {
                diag.invalidRawJsonParseError++;
                continue;
            }

            String clientChecksum = computeClientChecksumLikeTelemetry(raw);
            String gasChecksum = computeGasChecksumLikeServer(raw);

            if (sentChecksum.equals(clientChecksum)) {
                diag.invalidClientChecksumMatchesRaw++;
            } else {
                diag.invalidClientChecksumMismatchRaw++;
            }

            if (sentChecksum.equals(gasChecksum)) {
                diag.invalidGasChecksumMatchesRaw++;
            } else {
                diag.invalidGasChecksumMismatchRaw++;
            }

            String rawTopic = stringValue(raw.get("topic"));
            if (!rawTopic.equals(rawTopic.toUpperCase())) {
                diag.likelyTopicNormalization++;
            }

            String rawMetricType = stringValue(raw.get("metricType"));
            if (!rawMetricType.equals(rawMetricType.toUpperCase())) {
                diag.likelyMetricTypeNormalization++;
            }

            Object rawValue = raw.get("value");
            if (!(rawValue instanceof String)) {
                diag.likelyValueTypeNormalization++;
            }

            String rawTimestamp = stringValue(raw.get("timestamp"));
            String normalizedTimestamp = coerceIsoDateLikeGas(rawTimestamp);
            if (!normalizedTimestamp.equals(rawTimestamp)) {
                diag.likelyTimestampNormalization++;
            }

            String rawAdditionalData = stringValue(raw.get("additionalData"));
            String normalizedAdditionalData = normalizedAdditionalDataJson(raw.get("additionalData"));
            if (!rawAdditionalData.equals(normalizedAdditionalData)) {
                diag.likelyAdditionalDataNormalization++;
            }
        }

        System.out.println("\n=== DIAGNÓSTICO CHECKSUM ===");
        System.out.println("Registros analisados: " + diag.totalRecords);
        System.out.println("Checksum inválido (export): " + diag.invalidRecords);
        if (diag.invalidRecords == 0) {
            System.out.println("Nenhuma divergência de checksum encontrada neste recorte.");
            return;
        }

        System.out.println("Inválidos sem rawJson: " + diag.invalidWithoutRawJson);
        System.out.println("Inválidos com erro de parse do rawJson: " + diag.invalidRawJsonParseError);
        System.out.println("Checksum bate com algoritmo do cliente (raw): " + diag.invalidClientChecksumMatchesRaw);
        System.out.println("Checksum NÃO bate com algoritmo do cliente (raw): " + diag.invalidClientChecksumMismatchRaw);
        System.out.println("Checksum bate com algoritmo do servidor (raw normalizado): " + diag.invalidGasChecksumMatchesRaw);
        System.out.println("Checksum NÃO bate com algoritmo do servidor (raw normalizado): " + diag.invalidGasChecksumMismatchRaw);
        System.out.println("Sinais de normalização divergente -> topic: " + diag.likelyTopicNormalization
                + ", metricType: " + diag.likelyMetricTypeNormalization
                + ", value: " + diag.likelyValueTypeNormalization
                + ", timestamp: " + diag.likelyTimestampNormalization
                + ", additionalData: " + diag.likelyAdditionalDataNormalization);

        if (diag.invalidClientChecksumMatchesRaw > 0 && diag.invalidGasChecksumMismatchRaw > 0) {
            System.out.println("Conclusão provável: o cliente está assinando o payload bruto, mas o servidor valida após normalização.");
        }
        if (diag.invalidRecords > 0 && diag.invalidClientChecksumMatchesRaw == 0 && diag.invalidGasChecksumMatchesRaw == 0) {
            System.out.println("Observação: nenhum inválido bate em qualquer algoritmo de referência.");
            System.out.println("Isso geralmente indica que o rawJson exportado já está transformado em relação ao payload assinado no navegador.");
            System.out.println("Para validar a correção do checksum, use novos eventos gerados após a atualização do telemetry.js.");
        }
    }

    private static String computeClientChecksumLikeTelemetry(JsonObject raw) {
        JsonObject canonical = new JsonObject();
        canonical.map.put("eventId", stringValue(raw.get("eventId")));
        canonical.map.put("timestamp", stringValue(raw.get("timestamp")));
        canonical.map.put("sessionId", stringValue(raw.get("sessionId")));
        canonical.map.put("studentId", stringValue(raw.get("studentId")));
        canonical.map.put("metricType", stringValue(raw.get("metricType")));
        canonical.map.put("topic", stringValue(raw.get("topic")));
        canonical.map.put("value", raw.get("value") == null ? "" : raw.get("value"));
        canonical.map.put("additionalData", stringValue(raw.get("additionalData")));
        canonical.map.put("sequence", raw.get("sequence") == null ? 0 : raw.get("sequence"));
        canonical.map.put("installationId", stringValue(raw.get("installationId")));
        canonical.map.put("nickname", stringValue(raw.get("nickname")));
        return simpleHash(toJson(canonical));
    }

    private static String computeGasChecksumLikeServer(JsonObject raw) {
        JsonObject canonical = new JsonObject();
        canonical.map.put("eventId", stringValue(raw.get("eventId")));
        canonical.map.put("timestamp", coerceIsoDateLikeGas(stringValue(raw.get("timestamp"))));
        canonical.map.put("sessionId", stringValue(raw.get("sessionId")));
        canonical.map.put("studentId", stringValue(raw.get("studentId")));
        canonical.map.put("metricType", stringValue(raw.get("metricType")).toUpperCase());
        canonical.map.put("topic", stringValue(raw.get("topic")).toUpperCase());
        canonical.map.put("value", normalizeValueLikeGas(raw.get("value")));
        canonical.map.put("additionalData", normalizedAdditionalDataJson(raw.get("additionalData")));
        canonical.map.put("sequence", normalizeSequenceLikeGas(raw.get("sequence")));
        canonical.map.put("installationId", stringValue(raw.get("installationId")));
        canonical.map.put("nickname", stringValue(raw.get("nickname")));
        return simpleHash(toJson(canonical));
    }

    private static String coerceIsoDateLikeGas(String rawTs) {
        if (rawTs == null || rawTs.isBlank()) return "";
        try {
            return Instant.parse(rawTs).toString();
        } catch (Exception ignored) {
            return rawTs;
        }
    }

    private static String normalizeValueLikeGas(Object value) {
        if (value == null) return "";
        return String.valueOf(value);
    }

    private static int normalizeSequenceLikeGas(Object sequence) {
        if (sequence == null) return 0;
        if (sequence instanceof Number n) return (int) Math.floor(n.doubleValue());
        try {
            return (int) Math.floor(Double.parseDouble(String.valueOf(sequence)));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static String normalizedAdditionalDataJson(Object additionalDataRaw) {
        Object ad = additionalDataRaw;
        if (ad instanceof String s) {
            if (s.isBlank()) return "{}";
            try {
                ad = Json.parse(s);
            } catch (Exception ignored) {
                ad = new JsonObject();
            }
        }
        if (ad instanceof JsonObject || ad instanceof JsonArray) {
            return toJson(ad);
        }
        return "{}";
    }

    private static String simpleHash(String value) {
        String str = value == null ? "" : value;
        int hash = 0;
        for (int i = 0; i < str.length(); i++) {
            hash = ((hash << 5) - hash) + str.charAt(i);
        }
        long abs = hash == Integer.MIN_VALUE ? 2147483648L : Math.abs(hash);
        return Long.toString(abs, 36);
    }

    private static ImportSummary importAll(HttpClient client, String baseUrl, List<JsonObject> records, int batchSize) throws Exception {
        ImportSummary summary = new ImportSummary();
        summary.requestedRecords = records.size();
        if (records.isEmpty()) return summary;

        for (int i = 0; i < records.size(); i += batchSize) {
            int end = Math.min(records.size(), i + batchSize);
            JsonArray batch = new JsonArray();
            for (int j = i; j < end; j++) {
                batch.values.add(records.get(j));
            }

            JsonObject payload = new JsonObject();
            payload.map.put("records", batch);

            boolean imported = false;
            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    String response = postJson(client, baseUrl + "?action=import", toJson(payload), 90);
                    JsonObject result = asObject(Json.parse(response));
                    if (result == null) {
                        summary.errors += (end - i);
                    } else {
                        summary.batches++;
                        summary.inserted += intValue(result.get("inserted"));
                        summary.duplicates += intValue(result.get("duplicates"));
                        summary.checksumInvalid += intValue(result.get("checksumInvalid"));

                        JsonArray errors = asArray(result.get("errors"));
                        summary.errors += errors.values.size();
                    }
                    summary.processedRecords += (end - i);
                    imported = true;
                    break;
                } catch (HttpTimeoutException timeout) {
                    summary.timeoutRetries++;
                    if (attempt < 3) {
                        Thread.sleep(400L * attempt);
                    }
                } catch (IOException io) {
                    summary.failedBatches++;
                    summary.errors += (end - i);
                    imported = true;
                    break;
                }
            }
            if (!imported) {
                summary.failedBatches++;
                summary.errors += (end - i);
            }
        }

        return summary;
    }

    private static void printImportSummary(ImportSummary summary) {
        System.out.println("\n=== RESUMO IMPORT ===");
        System.out.println("Registros solicitados: " + summary.requestedRecords);
        System.out.println("Registros processados: " + summary.processedRecords);
        System.out.println("Batches enviados: " + summary.batches);
        System.out.println("Inseridos: " + summary.inserted);
        System.out.println("Duplicados: " + summary.duplicates);
        System.out.println("Checksum inválido: " + summary.checksumInvalid);
        System.out.println("Erros: " + summary.errors);
        System.out.println("Timeout retries: " + summary.timeoutRetries);
        System.out.println("Batches com falha: " + summary.failedBatches);
        if (summary.requestedRecords > summary.processedRecords) {
            System.out.println("ALERTA: nem todos os registros foram processados na importação.");
        }
    }

    private static void printTop(Map<String, Integer> map, int topN) {
        map.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(topN)
                .forEach(e -> System.out.println("- " + e.getKey() + ": " + e.getValue()));
    }

    private static void copyIfPresent(JsonObject source, JsonObject target, String key) {
        Object value = source.get(key);
        if (value != null) target.map.put(key, value);
    }

    private static String minIso(String current, String candidate) {
        if (current == null || current.isBlank()) return candidate;
        try {
            Instant a = Instant.parse(current);
            Instant b = Instant.parse(candidate);
            return b.isBefore(a) ? candidate : current;
        } catch (Exception ignored) {
            return current;
        }
    }

    private static String maxIso(String current, String candidate) {
        if (current == null || current.isBlank()) return candidate;
        try {
            Instant a = Instant.parse(current);
            Instant b = Instant.parse(candidate);
            return b.isAfter(a) ? candidate : current;
        } catch (Exception ignored) {
            return current;
        }
    }

    private static JsonObject getJson(HttpClient client, String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " ao chamar " + url + " => " + response.body());
        }
        return asObject(Json.parse(response.body()));
    }

    private static String postJson(HttpClient client, String url, String body) throws IOException, InterruptedException {
        return postJson(client, url, body, 30);
    }

    private static String postJson(HttpClient client, String url, String body, int timeoutSeconds) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(Math.max(1, timeoutSeconds)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " no POST " + url + " => " + response.body());
        }
        return response.body();
    }

    private static String stringValue(Object value) {
        if (value == null) return "";
        return String.valueOf(value);
    }

    private static int intValue(Object value) {
        if (value == null) return 0;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static boolean boolValue(Object value) {
        if (value instanceof Boolean b) return b;
        return "true".equalsIgnoreCase(stringValue(value));
    }

    private static JsonObject asObject(Object value) {
        return value instanceof JsonObject obj ? obj : null;
    }

    private static JsonArray asArray(Object value) {
        return value instanceof JsonArray arr ? arr : new JsonArray();
    }

    private static String toJson(Object value) {
        if (value == null) return "null";
        if (value instanceof String s) return '"' + escape(s) + '"';
        if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);

        if (value instanceof JsonObject obj) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, Object> entry : obj.map.entrySet()) {
                if (!first) sb.append(',');
                first = false;
                sb.append('"').append(escape(entry.getKey())).append('"').append(':').append(toJson(entry.getValue()));
            }
            return sb.append('}').toString();
        }

        if (value instanceof JsonArray arr) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.values.size(); i++) {
                if (i > 0) sb.append(',');
                sb.append(toJson(arr.values.get(i)));
            }
            return sb.append(']').toString();
        }

        if (value instanceof Map<?, ?> map) {
            JsonObject obj = new JsonObject();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                obj.map.put(String.valueOf(entry.getKey()), entry.getValue());
            }
            return toJson(obj);
        }

        if (value instanceof List<?> list) {
            JsonArray arr = new JsonArray();
            arr.values.addAll(list);
            return toJson(arr);
        }

        return '"' + escape(String.valueOf(value)) + '"';
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }

    private static class Config {
        String baseUrl = DEFAULT_BASE_URL;
        int exportLimit = DEFAULT_EXPORT_LIMIT;
        boolean importAll = false;
        int importBatch = DEFAULT_IMPORT_BATCH;
        String sinceIso;
        String untilIso;
        Instant sinceTs;
        Instant untilTs;

        static Config fromArgs(String[] args) {
            Config cfg = new Config();
            for (String arg : args) {
                if (arg.startsWith("--baseUrl=")) cfg.baseUrl = arg.substring("--baseUrl=".length());
                if (arg.startsWith("--limit=")) cfg.exportLimit = parsePositiveInt(arg.substring("--limit=".length()), DEFAULT_EXPORT_LIMIT);
                if (arg.startsWith("--importAll=")) cfg.importAll = Boolean.parseBoolean(arg.substring("--importAll=".length()));
                if (arg.startsWith("--batch=")) cfg.importBatch = parsePositiveInt(arg.substring("--batch=".length()), DEFAULT_IMPORT_BATCH);
                if (arg.startsWith("--since=")) cfg.sinceIso = emptyToNull(arg.substring("--since=".length()));
                if (arg.startsWith("--until=")) cfg.untilIso = emptyToNull(arg.substring("--until=".length()));
            }

            if (cfg.sinceIso != null) {
                cfg.sinceTs = parseRequiredInstant(cfg.sinceIso, "--since");
            }
            if (cfg.untilIso != null) {
                cfg.untilTs = parseRequiredInstant(cfg.untilIso, "--until");
            }
            if (cfg.sinceTs != null && cfg.untilTs != null && cfg.sinceTs.isAfter(cfg.untilTs)) {
                throw new IllegalArgumentException("--since deve ser menor ou igual a --until");
            }
            return cfg;
        }

        private static String emptyToNull(String value) {
            if (value == null) return null;
            String trimmed = value.trim();
            return trimmed.isEmpty() ? null : trimmed;
        }

        private static Instant parseRequiredInstant(String value, String argName) {
            Instant parsed = parseInstant(value);
            if (parsed == null) {
                throw new IllegalArgumentException("Formato inválido para " + argName + ": " + value + " (use ISO-8601, ex: 2026-03-22T12:00:00Z)");
            }
            return parsed;
        }

        private static int parsePositiveInt(String raw, int fallback) {
            try {
                int n = Integer.parseInt(raw.trim());
                return n > 0 ? n : fallback;
            } catch (Exception ignored) {
                return fallback;
            }
        }
    }

    private static class Metrics {
        int totalRecords;
        int duplicateEventIds;
        int checksumValid;
        int checksumInvalid;
        String minTimestamp = "";
        String maxTimestamp = "";

        Set<String> uniqueSessions = new HashSet<>();
        Set<String> uniqueStudents = new HashSet<>();
        Set<String> uniqueInstallations = new HashSet<>();
        Set<String> uniqueNicknames = new HashSet<>();
        Set<String> repeatingStudents = new HashSet<>();
        Set<String> gamifiedStudents = new HashSet<>();
        Map<String, Integer> byTopic = new HashMap<>();
        Map<String, Integer> byMetricType = new HashMap<>();
        Map<String, Integer> coverageExpectedFound = new HashMap<>();

        int ttaCount;
        double ttaSum;
        int ttaCorrectTargetCount;
        Map<String, SessionTta> ttaByStudentSession = new HashMap<>();
        double focusCurveFirstAvg;
        double focusCurveLastAvg;
        double focusCurveDelta;

        int scaffoldingTriggered;
        int challengeCorrect;
        Map<String, Integer> scaffoldingByLevel = new HashMap<>();
        Map<String, Map<String, Integer>> spatialConfusion = new HashMap<>();
        Map<String, Instant> hoverStarts = new HashMap<>();
        int hoverDurationCount;
        double hoverDurationSumMs;

        int executionComplete;
        int executionFailed;
        int executionFailedWithStateDump;
        int assemblyAnalysisCount;
        double assemblyInstructionCountSum;
        double assemblyComplexitySum;
        double assemblyJumpUsageSum;
        int hintEffectivenessCount;
        int hintEffectivenessSuccess;
        int hintAfterResponseCount;
        double hintAfterResponseSum;

        int quizAbandonedCount;
        Map<String, Integer> quizAbandonedByProgress = new HashMap<>();
        int quizAbandonedDurationCount;
        double quizAbandonedDurationSum;
        int userLevelUpCount;
        int achievementUnlockedCount;

        int pageLoadCount;
        double pageLoadSum;
        int slowLoadDetectedCount;
        int slowLoadDurationCount;
        double slowLoadDurationSum;
        int offlineEventsCount;
        Map<String, Instant> lastOfflineTsBySession = new HashMap<>();
        Set<String> sessionsContinuedAfterOffline = new HashSet<>();

        Map<String, StudentTechPerf> techPerfByStudent = new HashMap<>();
        double gamifiedExecSuccessRatePct;
        double nonGamifiedExecSuccessRatePct;
        double repeatingAvgQuizAccuracy;
        double newAvgQuizAccuracy;
    }

    private static class SessionTta {
        int count;
        double sum;
        Instant firstTs;
    }

    private static class StudentTechPerf {
        int execComplete;
        int execFailed;
        double quizAccuracySum;
        int quizAccuracyCount;
        int answerCorrectCount;
        int answerTotalCount;
    }

    private static class ImportSummary {
        int requestedRecords;
        int processedRecords;
        int batches;
        int inserted;
        int duplicates;
        int checksumInvalid;
        int errors;
        int timeoutRetries;
        int failedBatches;
    }

    private static class ChecksumDiagnostics {
        int totalRecords;
        int invalidRecords;
        int invalidWithoutRawJson;
        int invalidRawJsonParseError;
        int invalidClientChecksumMatchesRaw;
        int invalidClientChecksumMismatchRaw;
        int invalidGasChecksumMatchesRaw;
        int invalidGasChecksumMismatchRaw;
        int likelyTopicNormalization;
        int likelyMetricTypeNormalization;
        int likelyValueTypeNormalization;
        int likelyTimestampNormalization;
        int likelyAdditionalDataNormalization;
    }

    private static class JsonObject {
        Map<String, Object> map = new LinkedHashMap<>();
        Object get(String key) { return map.get(key); }
    }

    private static class JsonArray {
        List<Object> values = new ArrayList<>();
    }

    private static class Json {
        static Object parse(String input) {
            Parser p = new Parser(input);
            Object value = p.parseValue();
            p.skipWs();
            if (!p.eof()) throw new IllegalArgumentException("JSON inválido: conteúdo extra no final");
            return value;
        }

        private static class Parser {
            private final String s;
            private int i = 0;

            Parser(String s) { this.s = s == null ? "" : s; }

            Object parseValue() {
                skipWs();
                if (eof()) throw new IllegalArgumentException("JSON vazio");
                char c = s.charAt(i);
                if (c == '{') return parseObject();
                if (c == '[') return parseArray();
                if (c == '"') return parseString();
                if (c == 't' || c == 'f') return parseBoolean();
                if (c == 'n') return parseNull();
                return parseNumber();
            }

            JsonObject parseObject() {
                expect('{');
                JsonObject obj = new JsonObject();
                skipWs();
                if (peek('}')) { expect('}'); return obj; }
                while (true) {
                    String key = parseString();
                    skipWs();
                    expect(':');
                    Object value = parseValue();
                    obj.map.put(key, value);
                    skipWs();
                    if (peek('}')) { expect('}'); break; }
                    expect(',');
                }
                return obj;
            }

            JsonArray parseArray() {
                expect('[');
                JsonArray arr = new JsonArray();
                skipWs();
                if (peek(']')) { expect(']'); return arr; }
                while (true) {
                    arr.values.add(parseValue());
                    skipWs();
                    if (peek(']')) { expect(']'); break; }
                    expect(',');
                }
                return arr;
            }

            String parseString() {
                expect('"');
                StringBuilder sb = new StringBuilder();
                while (!eof()) {
                    char c = s.charAt(i++);
                    if (c == '"') return sb.toString();
                    if (c == '\\') {
                        if (eof()) throw new IllegalArgumentException("Escape inválido");
                        char e = s.charAt(i++);
                        switch (e) {
                            case '"' -> sb.append('"');
                            case '\\' -> sb.append('\\');
                            case '/' -> sb.append('/');
                            case 'b' -> sb.append('\b');
                            case 'f' -> sb.append('\f');
                            case 'n' -> sb.append('\n');
                            case 'r' -> sb.append('\r');
                            case 't' -> sb.append('\t');
                            case 'u' -> {
                                if (i + 4 > s.length()) throw new IllegalArgumentException("Unicode inválido");
                                String hex = s.substring(i, i + 4);
                                i += 4;
                                sb.append((char) Integer.parseInt(hex, 16));
                            }
                            default -> throw new IllegalArgumentException("Escape inválido: " + e);
                        }
                    } else {
                        sb.append(c);
                    }
                }
                throw new IllegalArgumentException("String não finalizada");
            }

            Object parseBoolean() {
                if (s.startsWith("true", i)) { i += 4; return true; }
                if (s.startsWith("false", i)) { i += 5; return false; }
                throw new IllegalArgumentException("Boolean inválido");
            }

            Object parseNull() {
                if (s.startsWith("null", i)) { i += 4; return null; }
                throw new IllegalArgumentException("null inválido");
            }

            Object parseNumber() {
                int start = i;
                if (peek('-')) i++;
                while (!eof() && Character.isDigit(s.charAt(i))) i++;
                if (!eof() && s.charAt(i) == '.') {
                    i++;
                    while (!eof() && Character.isDigit(s.charAt(i))) i++;
                }
                if (!eof() && (s.charAt(i) == 'e' || s.charAt(i) == 'E')) {
                    i++;
                    if (!eof() && (s.charAt(i) == '+' || s.charAt(i) == '-')) i++;
                    while (!eof() && Character.isDigit(s.charAt(i))) i++;
                }
                String raw = s.substring(start, i);
                if (raw.contains(".") || raw.contains("e") || raw.contains("E")) return Double.parseDouble(raw);
                try { return Integer.parseInt(raw); } catch (Exception ignored) { return Long.parseLong(raw); }
            }

            void skipWs() {
                while (!eof() && Character.isWhitespace(s.charAt(i))) i++;
            }

            boolean peek(char c) { return !eof() && s.charAt(i) == c; }

            void expect(char c) {
                skipWs();
                if (eof() || s.charAt(i) != c) throw new IllegalArgumentException("Esperado '" + c + "' na posição " + i);
                i++;
            }

            boolean eof() { return i >= s.length(); }
        }
    }
}
