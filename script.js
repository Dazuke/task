import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    updateDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
   ========================================= */

const firebaseConfig = {

    apiKey: "ISI_FIREBASE_API_KEY",

    authDomain:
        "PROJECT-ID.firebaseapp.com",

    projectId:
        "PROJECT-ID",

    storageBucket:
        "PROJECT-ID.firebasestorage.app",

    messagingSenderId:
        "ISI_SENDER_ID",

    appId:
        "ISI_APP_ID"

};


const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


/* =========================================
   STATE
   ========================================= */

let currentUser = null;

let subjectsData = [];

let tasksData = {};


/* =========================================
   ELEMENTS
   ========================================= */

const loginScreen =
    document.getElementById("loginScreen");

const appScreen =
    document.getElementById("app");

const emailInput =
    document.getElementById("emailInput");

const passwordInput =
    document.getElementById("passwordInput");

const loginBtn =
    document.getElementById("loginBtn");

const loginError =
    document.getElementById("loginError");


/* =========================================
   LOGIN
   ========================================= */

loginBtn.addEventListener(
    "click",
    async () => {

        loginError.textContent = "";

        try {

            await signInWithEmailAndPassword(
                auth,
                emailInput.value.trim(),
                passwordInput.value
            );

        } catch (error) {

            loginError.textContent =
                "Email atau password salah.";

            console.error(error);

        }

    }
);


/* =========================================
   AUTH STATE
   ========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (user) {

            currentUser = user;

            loginScreen.classList.add(
                "hidden"
            );

            appScreen.classList.remove(
                "hidden"
            );


            await loadData();

        } else {

            currentUser = null;

            appScreen.classList.add(
                "hidden"
            );

            loginScreen.classList.remove(
                "hidden"
            );

        }

    }
);


/* =========================================
   LOAD SUBJECTS
   ========================================= */

async function loadData() {

    const subjectsRef =
        collection(
            db,
            "subjects"
        );


    onSnapshot(
        subjectsRef,
        snapshot => {

            subjectsData =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            renderSubjects();

        }
    );

}


/* =========================================
   WEEK
   ========================================= */

const firstWeek =
    new Date(
        "2026-08-17T00:00:00"
    );


function getWeekNumber() {

    const now =
        new Date();

    const day =
        now.getDay();

    const monday =
        new Date(now);

    monday.setDate(
        now.getDate() -
        (day === 0 ? 6 : day - 1)
    );

    monday.setHours(
        0, 0, 0, 0
    );


    const diff =
        monday - firstWeek;


    return Math.max(
        1,
        Math.floor(
            diff /
            (7 * 24 * 60 * 60 * 1000)
        ) + 1
    );

}


function getWeekKey() {

    return `week-${getWeekNumber()}`;

}


/* =========================================
   RENDER
   ========================================= */

function renderSubjects() {

    const container =
        document.getElementById(
            "subjects"
        );


    container.innerHTML = "";


    let total = 0;

    let completed = 0;


    subjectsData
        .sort(
            (a, b) =>
                (a.order || 0) -
                (b.order || 0)
        )
        .forEach(subject => {

            const tasks =
                subject.tasks?.[
                    getWeekKey()
                ] || [];


            const done =
                tasks.filter(
                    task => task.done
                ).length;


            total += tasks.length;

            completed += done;


            const percentage =
                tasks.length
                    ? Math.round(
                        done /
                        tasks.length *
                        100
                    )
                    : 0;


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "subject glass";


            card.innerHTML = `

                <div class="subject-header">

                    <div class="subject-info">

                        <div class="subject-icon">
                            ${subject.icon || "📚"}
                        </div>

                        <div>

                            <h3 class="subject-name">
                                ${subject.name}
                            </h3>

                        </div>

                    </div>


                    <span class="sks">
                        ${subject.sks} SKS
                    </span>

                </div>


                <div class="subject-progress">

                    <div class="progress-top">

                        <span>
                            ${done}/${tasks.length}
                            selesai
                        </span>

                        <span>
                            ${percentage}%
                        </span>

                    </div>


                    <div class="progress-bar">

                        <div
                            class="progress-value"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                </div>


                <div class="tasks">

                    <div class="tasks-inner">

                        ${
                            tasks.map(
                                (task, index) => `

                                <div
                                    class="task ${
                                        task.done
                                            ? "done"
                                            : ""
                                    }"
                                    data-subject="${subject.id}"
                                    data-index="${index}"
                                >

                                    <span class="task-checkbox">
                                        ${
                                            task.done
                                                ? "✓"
                                                : ""
                                        }
                                    </span>

                                    <span class="task-text">
                                        ${task.name}
                                    </span>

                                </div>

                            `
                            ).join("")
                        }

                    </div>

                </div>

            `;


            const header =
                card.querySelector(
                    ".subject-header"
                );


            header.addEventListener(
                "click",
                () => {

                    card.classList.toggle(
                        "open"
                    );

                }
            );


            card
                .querySelectorAll(".task")
                .forEach(task => {

                    task.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            toggleTask(
                                task.dataset.subject,
                                Number(
                                    task.dataset.index
                                )
                            );

                        }
                    );

                });


            container.appendChild(card);

        });


    updateOverall(
        total,
        completed
    );

}


/* =========================================
   TOGGLE TASK
   ========================================= */

async function toggleTask(
    subjectId,
    taskIndex
) {

    const subject =
        subjectsData.find(
            item =>
                item.id === subjectId
        );


    if (!subject) {
        return;
    }


    const tasks =
        [
            ...(subject.tasks?.[
                getWeekKey()
            ] || [])
        ];


    if (!tasks[taskIndex]) {
        return;
    }


    tasks[taskIndex].done =
        !tasks[taskIndex].done;


    await updateDoc(
        doc(
            db,
            "subjects",
            subjectId
        ),
        {
            [`tasks.${getWeekKey()}`]:
                tasks
        }
    );

}


/* =========================================
   OVERALL
   ========================================= */

function updateOverall(
    total,
    completed
) {

    const percentage =
        total
            ? Math.round(
                completed /
                total *
                100
            )
            : 0;


    document.getElementById(
        "overallPercent"
    ).textContent =
        `${percentage}%`;


    document.getElementById(
        "circleValue"
    ).textContent =
        `${percentage}%`;


    document.querySelector(
        ".circle-progress"
    ).style.setProperty(
        "--progress",
        `${percentage * 3.6}deg`
    );


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;


    document.getElementById(
        "remainingCount"
    ).textContent =
        total - completed;

}


/* =========================================
   THEME
   ========================================= */

const themeBtn =
    document.getElementById(
        "themeBtn"
    );

const themePanel =
    document.getElementById(
        "themePanel"
    );

const closeTheme =
    document.getElementById(
        "closeTheme"
    );


themeBtn.addEventListener(
    "click",
    () => {

        themePanel.classList.toggle(
            "hidden"
        );

    }
);


closeTheme.addEventListener(
    "click",
    () => {

        themePanel.classList.add(
            "hidden"
        );

    }
);


document
    .querySelectorAll(
        ".theme-option"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const theme =
                    button.dataset.theme;


                document.body.classList.remove(
                    "light",
                    "amoled"
                );


                if (
                    theme === "light"
                ) {

                    document.body.classList.add(
                        "light"
                    );

                }


                if (
                    theme === "amoled"
                ) {

                    document.body.classList.add(
                        "amoled"
                    );

                }


                localStorage.setItem(
                    "theme",
                    theme
                );

            }
        );

    });


/* LOAD THEME */

const savedTheme =
    localStorage.getItem(
        "theme"
    );


if (
    savedTheme === "light" ||
    savedTheme === "amoled"
) {

    document.body.classList.add(
        savedTheme
    );

}


/* =========================================
   WALLPAPER
   ========================================= */

const wallpaperInput =
    document.getElementById(
        "wallpaperInput"
    );


const savedWallpaper =
    localStorage.getItem(
        "wallpaper"
    );


if (savedWallpaper) {

    document.querySelector(
        ".background"
    ).style.backgroundImage =
        `url(${savedWallpaper})`;

}


wallpaperInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];


        if (!file) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function () {

                const result =
                    reader.result;


                localStorage.setItem(
                    "wallpaper",
                    result
                );


                document.querySelector(
                    ".background"
                ).style.backgroundImage =
                    `url(${result})`;

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* =========================================
   LOGOUT
   ========================================= */

document
    .getElementById(
        "logoutBtn"
    )
    .addEventListener(
        "click",
        () => {

            signOut(auth);

        }
    );


/* =========================================
   WEEK DISPLAY
   ========================================= */

function updateWeekDisplay() {

    const week =
        getWeekNumber();


    document.getElementById(
        "weekNumber"
    ).textContent =
        String(week).padStart(
            2,
            "0"
        );


    const now =
        new Date();


    const day =
        now.getDay();


    const monday =
        new Date(now);


    monday.setDate(
        now.getDate() -
        (day === 0 ? 6 : day - 1)
    );


    const saturday =
        new Date(monday);


    saturday.setDate(
        monday.getDate() + 5
    );


    const format =
        date =>
            date.toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );


    document.getElementById(
        "weekPeriod"
    ).textContent =
        `${format(monday)} — ${format(saturday)}`;

}


updateWeekDisplay();
