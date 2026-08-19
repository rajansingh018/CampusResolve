const express = require("express");

const College = require("../models/College");

const router = express.Router();


// Get all colleges

router.get("/", async (req, res) => {

    try {

        const colleges =
            await College.find()
                .sort({ name: 1 });


        res.json(colleges);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to fetch colleges."
        });

    }

});


// Get single college

router.get("/:id", async (req, res) => {

    try {

        const college =
            await College.findById(
                req.params.id
            );


        if (!college) {

            return res.status(404).json({
                message: "College not found."
            });

        }


        res.json(college);

    } catch (error) {

        res.status(500).json({
            message: "Unable to fetch college."
        });

    }

});


module.exports = router;