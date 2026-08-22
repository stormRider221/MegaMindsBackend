const express = require("express");

const router = express.Router();

const Student = require("../models/Student");
const AssessmentProgress = require("../models/AssessmentProgress");

// ==========================================
// POST /api/assessments/submit
// Save an assessment result
// ==========================================

router.post("/submit", async (req, res) => {
    try {

        const {
            studentId,
            contentId,
            contentType,
            score,
            correctAnswers,
            totalQuestions
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !studentId ||
            !contentId ||
            !contentType ||
            score === undefined ||
            correctAnswers === undefined ||
            !totalQuestions
        ) {
            return res.status(400).json({
                message: "Missing required assessment information."
            });
        }


        // ==========================================
        // VALIDATE CONTENT TYPE
        // ==========================================

        if (!["Book", "Lesson"].includes(contentType)) {
            return res.status(400).json({
                message: "Invalid content type."
            });
        }


        // ==========================================
        // VALIDATE STUDENT
        // ==========================================

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }


        // ==========================================
        // VALIDATE SCORE
        // ==========================================

        if (score < 0 || score > 100) {
            return res.status(400).json({
                message: "Score must be between 0 and 100."
            });
        }


        // ==========================================
        // VALIDATE ANSWERS
        // ==========================================

        if (
            correctAnswers < 0 ||
            correctAnswers > totalQuestions
        ) {
            return res.status(400).json({
                message: "Invalid number of correct answers."
            });
        }


        // ==========================================
        // FIND EXISTING PROGRESS
        // ==========================================

        let assessment = await AssessmentProgress.findOne({
            studentId,
            contentId,
            contentType
        });


        // ==========================================
        // CREATE IF FIRST ATTEMPT
        // ==========================================

        if (!assessment) {

            assessment = new AssessmentProgress({
                studentId,
                contentId,
                contentType,
                attempts: [],
                totalAttempts: 0
            });

        }


        // ==========================================
        // ADD NEW ATTEMPT
        // ==========================================

        assessment.attempts.push({
            score,
            correctAnswers,
            totalQuestions,
            attemptedAt: new Date()
        });


        // ==========================================
        // INCREASE TOTAL ATTEMPTS
        // ==========================================

        assessment.totalAttempts += 1;


        // ==========================================
        // KEEP ONLY THE LATEST 20
        // ==========================================

        if (assessment.attempts.length > 20) {

            assessment.attempts =
                assessment.attempts.slice(-20);

        }


        // ==========================================
        // SAVE
        // ==========================================

        await assessment.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(201).json({

            message: "Assessment result saved successfully.",

            assessment: {

                studentId: assessment.studentId,

                contentId: assessment.contentId,

                contentType: assessment.contentType,

                score,

                correctAnswers,

                totalQuestions,

                totalAttempts:
                    assessment.totalAttempts,

                attemptsStored:
                    assessment.attempts.length

            }

        });

    } catch (error) {

        console.error(
            "Assessment submission error:",
            error
        );

        res.status(500).json({
            message:
                "Server error saving assessment result."
        });

    }
});


// ==========================================
// GET /api/assessments/:studentId/:contentType/:contentId
// Get assessment history for a student
// ==========================================

router.get(
    "/:studentId/:contentType/:contentId",
    async (req, res) => {

        try {

            const {
                studentId,
                contentType,
                contentId
            } = req.params;


            // ==========================================
            // VALIDATE CONTENT TYPE
            // ==========================================

            if (!["Book", "Lesson"].includes(contentType)) {

                return res.status(400).json({
                    message: "Invalid content type."
                });

            }


            // ==========================================
            // FIND ASSESSMENT PROGRESS
            // ==========================================

            const assessment =
                await AssessmentProgress.findOne({
                    studentId,
                    contentId,
                    contentType
                });


            // ==========================================
            // NO ATTEMPTS YET
            // ==========================================

            if (!assessment) {

                return res.json({

                    studentId,

                    contentId,

                    contentType,

                    attempts: [],

                    totalAttempts: 0,

                    averageScore: 0,

                    bestScore: 0,

                    latestScore: null

                });

            }


            // ==========================================
            // GET ATTEMPTS
            // ==========================================

            const attempts = assessment.attempts;


            // ==========================================
            // CALCULATE AVERAGE SCORE
            // ==========================================

            const totalScore = attempts.reduce(
                (sum, attempt) =>
                    sum + attempt.score,
                0
            );

            const averageScore =
                attempts.length > 0
                    ? Math.round(
                        totalScore /
                        attempts.length
                    )
                    : 0;


            // ==========================================
            // BEST SCORE
            // ==========================================

            const bestScore =
                attempts.length > 0
                    ? Math.max(
                        ...attempts.map(
                            attempt =>
                                attempt.score
                        )
                    )
                    : 0;


            // ==========================================
            // LATEST SCORE
            // ==========================================

            const latestAttempt =
                attempts.length > 0
                    ? attempts[attempts.length - 1]
                    : null;


            // ==========================================
            // RESPONSE
            // ==========================================

            res.json({

                studentId:
                    assessment.studentId,

                contentId:
                    assessment.contentId,

                contentType:
                    assessment.contentType,

                attempts,

                totalAttempts:
                    assessment.totalAttempts,

                attemptsStored:
                    attempts.length,

                averageScore,

                bestScore,

                latestScore:
                    latestAttempt
                        ? latestAttempt.score
                        : null,

                latestAttempt

            });

        } catch (error) {

            console.error(
                "Assessment history error:",
                error
            );

            res.status(500).json({

                message:
                    "Server error fetching assessment history."

            });

        }

    }
);


module.exports = router;