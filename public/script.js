import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey: "AIzaSyBGhV7PPcNqwYnvSRKqOercbRMlW0V125I",
  authDomain: "valine-b06ad.firebaseapp.com",
  databaseURL: "https://valine-b06ad-default-rtdb.firebaseio.com",
  projectId: "valine-b06ad",
  storageBucket: "valine-b06ad.firebasestorage.app",
  messagingSenderId: "188820674947",
  appId: "1:188820674947:web:f741e4905238f0b804beb6",
  measurementId: "G-4S2ZD7ELH1"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/*
    LOCAL persistence:

    User tetap login setelah Chrome ditutup.
*/

await setPersistence(
    auth,
    browserLocalPersistence
);


/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;

let currentProfile = null;

let subjects = [];

let tasks = [];

let currentWeek = "week-09";


/* =====================================================
   DOM
===================================================== */

const authScreen =
    document.getElementById("authScreen");

const appScreen =
    document.getElementById("appScreen");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const authMessage =
    document.getElementById("authMessage");

const subjectsContainer =
    document.getElementById("subjectsContainer");


/* =====================================================
   AUTH UI
===================================================== */

document
    .getElementById("showRegisterBtn")
    .onclick = () => {

        loginForm.classList.add("hidden");

        registerForm.classList.remove("hidden");

        authMessage.textContent = "";
    };


document
    .getElementById("showLoginBtn")
    .onclick = () => {

        registerForm.classList.add("hidden");

        loginForm.classList.remove("hidden");

        authMessage.textContent = "";
    };


/* =====================================================
   HELPERS
===================================================== */

function normalizePhone(phone) {

    if (!phone) return "";

    phone =
        phone
            .replace(/\D/g, "");

    if (phone.startsWith("0")) {

        phone =
            "62" + phone.slice(1);

    }

    if (phone.startsWith("+")) {

        phone =
            phone.slice(1);

    }

    return phone;
}


function nimToEmail(nim) {

    /*
        NIM digunakan sebagai username.

        Firebase Auth tetap membutuhkan email,
        jadi kita buat email internal.
    */

    return `${nim}@class01sife002.local`;
}


function showMessage(message) {

    authMessage.textContent =
        message;
}


/* =====================================================
   REGISTER
===================================================== */

document
    .getElementById("registerBtn")
    .onclick = async () => {

        const name =
            document
                .getElementById("registerName")
                .value
                .trim();

        const nim =
            document
                .getElementById("registerNim")
                .value
                .trim();

        const password =
            document
                .getElementById("registerPassword")
                .value;

        const confirmPassword =
            document
                .getElementById("registerPasswordConfirm")
                .value;

        const whatsapp =
            normalizePhone(
                document
                    .getElementById("registerWhatsapp")
                    .value
            );

        const reminder =
            document
                .getElementById("registerReminder")
                .checked;


        if (!name || !nim || !password) {

            showMessage(
                "Nama, NIM dan password wajib diisi."
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "Password minimal 6 karakter."
            );

            return;
        }


        if (password !== confirmPassword) {

            showMessage(
                "Konfirmasi password tidak sama."
            );

            return;
        }


        if (reminder && !whatsapp) {

            showMessage(
                "Isi nomor WhatsApp untuk mengaktifkan reminder."
            );

            return;
        }


        try {

            const email =
                nimToEmail(nim);


            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const uid =
                credential.user.uid;


            await setDoc(
                doc(db, "users", uid),
                {

                    name,

                    nim,

                    whatsapp,

                    whatsappReminder:
                        reminder,

                    reminderSchedule:
                        "friday_06",

                    role:
                        "member",

                    theme:
                        "dark",

                    createdAt:
                        new Date()

                }
            );


            showMessage(
                "Account berhasil dibuat."
            );


        } catch (error) {

            console.error(error);

            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                showMessage(
                    "NIM sudah terdaftar."
                );

            } else {

                showMessage(
                    error.message
                );

            }

        }

    };


/* =====================================================
   LOGIN
===================================================== */

document
    .getElementById("loginBtn")
    .onclick = async () => {

        const nim =
            document
                .getElementById("loginNim")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!nim || !password) {

            showMessage(
                "NIM dan password wajib diisi."
            );

            return;
        }


        try {

            await signInWithEmailAndPassword(
                auth,
                nimToEmail(nim),
                password
            );

        } catch (error) {

            console.error(error);

            showMessage(
                "NIM atau password salah."
            );

        }

    };


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            currentUser = null;

            authScreen.classList.remove(
                "hidden"
            );

            appScreen.classList.add(
                "hidden"
            );

            return;
        }


        currentUser = user;


        authScreen.classList.add(
            "hidden"
        );

        appScreen.classList.remove(
            "hidden"
        );


        await loadProfile();

        await loadSubjects();

        await loadTasks();

        renderApp();

    }
);


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

    const snap =
        await getDoc(
            doc(
                db,
                "users",
                currentUser.uid
            )
        );


    if (!snap.exists()) {

        console.error(
            "Profile tidak ditemukan."
        );

        return;
    }


    currentProfile =
        snap.data();

}


/* =====================================================
   SUBJECTS
===================================================== */

async function loadSubjects() {

    const snapshot =
        await getDocs(
            query(
                collection(db, "subjects"),
                orderBy("order", "asc")
            )
        );


    subjects =
        snapshot.docs.map(
            doc => ({
                id: doc.id,
                ...doc.data()
            })
        );

}


/* =====================================================
   TASKS
===================================================== */

async function loadTasks() {

    const snapshot =
        await getDocs(
            query(
                collection(
                    db,
                    "weeks",
                    currentWeek,
                    "tasks"
                ),
                orderBy("order", "asc")
            )
        );


    tasks =
        snapshot.docs.map(
            doc => ({
                id: doc.id,
                ...doc.data()
            })
        );

}


/* =====================================================
   USER PROGRESS
===================================================== */

async function getProgress() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "users",
                currentUser.uid,
                "progress",
                currentWeek,
                "tasks"
            )
        );


    const result = {};

    snapshot.docs.forEach(
        item => {

            result[item.id] =
                item.data().done === true;

        }
    );


    return result;
}


/* =====================================================
   SAVE CHECK
===================================================== */

async function toggleTask(
    taskId,
    done
) {

    await setDoc(
        doc(
            db,
            "users",
            currentUser.uid,
            "progress",
            currentWeek,
            "tasks",
            taskId
        ),
        {
            done,
            updatedAt:
                new Date()
        },
        {
            merge: true
        }
    );


    await renderApp();
}


/* =====================================================
   RENDER APP
===================================================== */

async function renderApp() {

    const progress =
        await getProgress();


    let total = tasks.length;

    let completed =
        tasks.filter(
            task =>
                progress[task.id]
        ).length;


    const percent =
        total === 0
            ? 0
            : Math.round(
                completed /
                total *
                100
            );


    document
        .getElementById("totalTasks")
        .textContent =
        total;


    document
        .getElementById("completedTasks")
        .textContent =
        completed;


    document
        .getElementById("remainingTasks")
        .textContent =
        total - completed;


    document
        .getElementById("overallPercent")
        .textContent =
        `${percent}%`;


    document
        .querySelector(".progress-ring")
        .style
        .setProperty(
            "--progress",
            `${percent}%`
        );


    document
        .getElementById("weekTitle")
        .textContent =
        currentWeek
            .replace("week-", "WEEK ");


    subjectsContainer.innerHTML = "";


    subjects.forEach(
        subject => {

            const subjectTasks =
                tasks.filter(
                    task =>
                        task.subjectId ===
                        subject.id
                );


            const subjectDone =
                subjectTasks.filter(
                    task =>
                        progress[task.id]
                ).length;


            const subjectPercent =
                subjectTasks.length === 0
                    ? 0
                    : Math.round(
                        subjectDone /
                        subjectTasks.length *
                        100
                    );


            const card =
                document.createElement("div");


            card.className =
                "subject-card";


            card.innerHTML = `

                <div class="subject-header">

                    <div class="subject-left">

                        <div class="subject-icon">
                            📚
                        </div>

                        <div>

                            <div class="subject-name">
                                ${escapeHtml(subject.name)}
                            </div>

                            <div class="subject-meta">
                                ${subject.sks || 2} SKS
                                ·
                                ${subjectDone}/${subjectTasks.length}
                                selesai
                            </div>

                        </div>

                    </div>

                    <div class="subject-percent">
                        ${subjectPercent}%
                    </div>

                </div>

                <div class="subject-progress">
                    <div style="width:${subjectPercent}%"></div>
                </div>

                <div class="task-list"></div>

            `;


            const taskList =
                card.querySelector(
                    ".task-list"
                );


            subjectTasks.forEach(
                task => {

                    const taskElement =
                        document.createElement(
                            "div"
                        );


                    taskElement.className =
                        "task";


                    if (progress[task.id]) {

                        taskElement.classList.add(
                            "done"
                        );

                    }


                    taskElement.innerHTML = `

                        <button
                            class="task-check"
                            title="Checklist"
                        >
                            ${progress[task.id] ? "✓" : ""}
                        </button>

                        <span class="task-name">
                            ${escapeHtml(task.name)}
                        </span>

                        ${
                            currentProfile?.role ===
                            "admin"
                            ?
                            `
                            <button
                                class="task-delete"
                                title="Hapus"
                            >
                                ×
                            </button>
                            `
                            :
                            ""
                        }

                    `;


                    taskElement
                        .querySelector(
                            ".task-check"
                        )
                        .onclick =
                        async event => {

                            event.stopPropagation();

                            await toggleTask(
                                task.id,
                                !progress[task.id]
                            );

                        };


                    if (
                        currentProfile?.role ===
                        "admin"
                    ) {

                        taskElement
                            .querySelector(
                                ".task-delete"
                            )
                            .onclick =
                            async event => {

                                event.stopPropagation();

                                if (
                                    !confirm(
                                        "Hapus task ini?"
                                    )
                                ) return;


                                await deleteDoc(
                                    doc(
                                        db,
                                        "weeks",
                                        currentWeek,
                                        "tasks",
                                        task.id
                                    )
                                );


                                await loadTasks();

                                await renderApp();

                            };

                    }


                    taskList.appendChild(
                        taskElement
                    );

                }
            );


            card
                .querySelector(
                    ".subject-header"
                )
                .onclick =
                () => {

                    card.classList.toggle(
                        "open"
                    );

                };


            subjectsContainer.appendChild(
                card
            );

        }
    );


    updateProfileUI();

}


/* =====================================================
   PROFILE UI
===================================================== */

function updateProfileUI() {

    if (!currentProfile)
        return;


    document
        .getElementById("profileName")
        .textContent =
        currentProfile.name || "-";


    document
        .getElementById("profileNim")
        .textContent =
        currentProfile.nim || "-";


    document
        .getElementById("profileWhatsapp")
        .textContent =
        currentProfile.whatsapp ||
        "Belum diatur";


    document
        .getElementById("profileReminder")
        .textContent =
        currentProfile.whatsappReminder
            ? "ON"
            : "OFF";


    document
        .getElementById("profileWhatsappInput")
        .value =
        currentProfile.whatsapp || "";


    document
        .getElementById("profileReminderInput")
        .checked =
        currentProfile.whatsappReminder ||
        false;


    const schedule =
        currentProfile.reminderSchedule ||
        "friday_06";


    document
        .querySelectorAll(
            'input[name="schedule"]'
        )
        .forEach(
            radio => {

                radio.checked =
                    radio.value ===
                    schedule;

            }
        );


    applyTheme(
        currentProfile.theme ||
        "dark"
    );

}


/* =====================================================
   PROFILE MODAL
===================================================== */

document
    .getElementById("profileBtn")
    .onclick =
    () => {

        document
            .getElementById("profileModal")
            .classList.remove(
                "hidden"
            );

    };


document
    .getElementById("saveProfileBtn")
    .onclick =
    async () => {

        const whatsapp =
            normalizePhone(
                document
                    .getElementById(
                        "profileWhatsappInput"
                    )
                    .value
            );


        const reminder =
            document
                .getElementById(
  
