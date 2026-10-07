const {
    onSchedule
} = require(
    "firebase-functions/v2/scheduler"
);

const {
    onRequest
} = require(
    "firebase-functions/v2/https"
);

const {
    defineJsonSecret
} = require(
    "firebase-functions/params"
);

const admin =
    require("firebase-admin");


admin.initializeApp();


const db =
    admin.firestore();


/*
    WhatsApp credentials disimpan
    di Firebase Secret Manager.

    Jangan taruh token di JS frontend.
*/

const whatsappConfig =
    defineJsonSecret(
        "WHATSAPP_CONFIG"
    );


/* =====================================================
   CURRENT WEEK
===================================================== */

function getCurrentWeek() {

    /*
        Anchor:
        17 Agustus 2026 = WEEK 01

        Bisa lu ubah kalau kalender
        kampus resmi berbeda.
    */

    const anchor =
        new Date(
            "2026-08-17T00:00:00+07:00"
        );


    const now =
        new Date();


    const diff =
        now.getTime() -
        anchor.getTime();


    const week =
        Math.floor(
            diff /
            (7 * 24 * 60 * 60 * 1000)
        ) + 1;


    return `week-${String(
        week
    ).padStart(2, "0")}`;

}


/* =====================================================
   GET INCOMPLETE TASKS
===================================================== */

async function getIncompleteTasks(
    uid,
    weekId
) {

    const taskSnapshot =
        await db
            .collection("weeks")
            .doc(weekId)
            .collection("tasks")
            .orderBy("order")
            .get();


    const progressSnapshot =
        await db
            .collection("users")
            .doc(uid)
            .collection("progress")
            .doc(weekId)
            .collection("tasks")
            .get();


    const completed =
        new Set();


    progressSnapshot.forEach(
        doc => {

            if (
                doc.data().done === true
            ) {

                completed.add(
                    doc.id
                );

            }

        }
    );


    const incomplete = [];


    taskSnapshot.forEach(
        doc => {

            if (
                !completed.has(doc.id)
            ) {

                incomplete.push({
                    id: doc.id,
                    ...doc.data()
                });

            }

        }
    );


    return incomplete;

}


/* =====================================================
   SEND WHATSAPP
===================================================== */

async function sendWhatsApp(
    phone,
    incompleteTasks
) {

    const config =
        whatsappConfig.value();


    /*
        Contoh secret:

        {
            "accessToken": "...",
            "phoneNumberId": "...",
            "graphApiVersion": "vXX.X"
        }

        Isi graphApiVersion dengan versi
        Graph API yang aktif di Meta.
    */


    const url =
        `https://graph.facebook.com/` +
        `${config.graphApiVersion}/` +
        `${config.phoneNumberId}/messages`;


    /*
        Untuk reminder bisnis yang
        dikirim oleh sistem secara proaktif,
        gunakan approved WhatsApp template
        sesuai konfigurasi WhatsApp Business lu.

        Nama template di bawah hanya contoh.
    */

    const response =
        await fetch(
            url,
            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${config.accessToken}`,

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        messaging_product:
                            "whatsapp",

                        to:
                            phone,

                        type:
                            "template",

                        template: {

                            name:
                                config.templateName,

                            language: {

                                code:
                                    config.templateLanguage ||
                                    "id"

                            },

                            components: [

                                {

                                    type:
                                        "body",

                                    parameters: [

                                        {

                                            type:
                                                "text",

                                            text:
                                                incompleteTasks
                                                    .length
                                                    .toString()

                                        }

                                    ]

                                }

                            ]

                        }

                    })

            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        throw new Error(
            JSON.stringify(result)
        );

    }


    return result;

}


/* =====================================================
   SCHEDULED REMINDER
===================================================== */

exports.fridayReminder =
    onSchedule(
        {
            schedule:
                "0 6 * * 5",

            timeZone:
                "Asia/Jakarta",

            secrets:
                [whatsappConfig]
        },

        async () => {

            const weekId =
                getCurrentWeek();


            const usersSnapshot =
                await db
                    .collection("users")
                    .where(
                        "whatsappReminder",
                        "==",
                        true
                    )
                    .where(
                        "reminderSchedule",
                        "==",
                        "friday_06"
                    )
                    .get();


            console.log(
                `Reminder week: ${weekId}`
            );


            for (
                const userDoc
                of usersSnapshot.docs
            ) {

                const user =
                    userDoc.data();


                if (
                    !user.whatsapp
                ) {

                    continue;

                }


                try {

                    const incomplete =
                        await getIncompleteTasks(
                            userDoc.id,
                            weekId
                        );


                    /*
                        Kalau semuanya selesai,
                        jangan kirim pesan.
                    */

                    if (
                        incomplete.length === 0
                    ) {

                        console.log(
                            `Skip ${user.nim}: complete`
                        );

                        continue;

                    }


                    await sendWhatsApp(
                        user.whatsapp,
                        incomplete
                    );


                    console.log(
                        `Reminder sent to ${user.nim}`
                    );


                } catch (error) {

                    console.error(
                        `Reminder failed for ${user.nim}`,
                        error
                    );

                }

            }

        }
    );


/* =====================================================
   OPTIONAL TEST ENDPOINT
===================================================== */

exports.testReminder =
    onRequest(
        {
            secrets:
                [whatsappConfig]
        },

        async (req, res) => {

            try {

                if (
                    req.method !==
                    "POST"
                ) {

                    return res
                        .status(405)
                        .json({
                            error:
                                "POST only"
                        });

                }


                const {
                    uid
                } =
                    req.body;


                if (!uid) {

                    return res
                        .status(400)
                        .json({
                            error:
                                "uid required"
                        });

                }


                const weekId =
                    getCurrentWeek();


                const incomplete =
                    await getIncompleteTasks(
                        uid,
                        weekId
                    );


                return res.json({

                    weekId,

                    incompleteCount:
                        incomplete.length,

                    tasks:
                        incomplete.map(
                            task =>
                                task.name
                        )

                });


            } catch (error) {

                console.error(
                    error
                );


                return res
                    .status(500)
                    .json({
                        error:
                            error.message
                    });

            }

        }
    );
