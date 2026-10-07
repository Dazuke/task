/* =========================================
   DIKA TRACK MENTARI
   ========================================= */


/* =========================================
   DATA MATA KULIAH
   ========================================= */

const subjects = [

    {
        id: "algoritma",
        name: "Algoritma dan Pemrograman",
        sks: 3
    },

    {
        id: "aljabar",
        name: "Aljabar Linier dan Matriks",
        sks: 3
    },

    {
        id: "basisdata",
        name: "Sistem Basis Data",
        sks: 3
    },

    {
        id: "ai",
        name: "Pengantar Kecerdasan Buatan",
        sks: 3
    },

    {
        id: "kewarganegaraan",
        name: "Kewarganegaraan",
        sks: 2
    },

    {
        id: "psi",
        name: "Pengantar Sistem Informasi",
        sks: 2
    },

    {
        id: "english",
        name: "Basic English",
        sks: 2
    },

    {
        id: "bahasa",
        name: "Bahasa Indonesia",
        sks: 2
    }

];


/* =========================================
   TUGAS KHUSUS MINGGU INI
   5 - 10 OKTOBER 2026
   ========================================= */

const currentWeekTasks = {

    algoritma: [
        "P8: Pretest",
        "P8: Postest",
        "P9: Pretest",
        "P9: Postest",
        "Laporan P7"
    ],

    aljabar: [
        "P8: Pretest",
        "P8: Postest",
        "P9: Pretest",
        "P9: Postest"
    ],

    basisdata: [
        "P8: Pretest",
        "P8: Postest",
        "P9: Pretest",
        "P9: Postest",
        "Buat database menggunakan XAMPP/Laragon"
    ],

    ai: [
        "P8: Pretest",
        "P8: Postest",
        "P9: Pretest",
        "P9: Postest",
        "Analisis kasus"
    ],

    kewarganegaraan: [
        "Pretest",
        "Fordis",
        "Postest",
        "Kuesioner"
    ],

    psi: [
        "Pretest",
        "Fordis",
        "Postest",
        "Kuesioner"
    ],

    english: [
        "Pretest",
        "Penugasan",
        "Fordis",
        "Postest",
        "Kuesioner"
    ],

    bahasa: [
        "Pretest",
        "Fordis",
        "Postest",
        "Kuesioner"
    ]

};


/* =========================================
   TANGGAL AWAL KULIAH
   ========================================= */

/*
   Minggu pertama dimulai dari
   Senin 17 Agustus 2026.

   Jadi:
   Minggu 1 = 17-22 Agustus
   Minggu 2 = 24-29 Agustus
   ...
   Minggu 8 = 28 Sep-3 Okt
   Minggu 9 = 5-10 Okt
*/

const firstWeekDate = new Date("2026-08-17T00:00:00");


/* =========================================
   STORAGE
   ========================================= */

const STORAGE_KEY = "dikaTrackMentari";


function getStorage() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return {};
    }

    try {
        return JSON.parse(data);
    } catch {
        return {};
    }

}


function saveStorage(data) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =========================================
   HITUNG MINGGU
   ========================================= */

function getWeekNumber(date = new Date()) {

    const current = new Date(date);

    current.setHours(0, 0, 0, 0);

    /*
       Cari Senin dari minggu sekarang
    */

    const day = current.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    current.setDate(current.getDate() + diff);


    const first = new Date(firstWeekDate);

    first.setHours(0, 0, 0, 0);


    const difference =
        current.getTime() - first.getTime();


    const week =
        Math.floor(
            difference / (7 * 24 * 60 * 60 * 1000)
        ) + 1;


    return Math.max(1, week);

}


/* =========================================
   INFO MINGGU
   ========================================= */

function getWeekDates(date = new Date()) {

    const current = new Date(date);

    current.setHours(0, 0, 0, 0);

    const day = current.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(current);

    monday.setDate(
        current.getDate() + diff
    );

    const saturday = new Date(monday);

    saturday.setDate(
        monday.getDate() + 5
    );

    return {
        monday,
        saturday
    };

}


function formatDate(date) {

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   KEY DATA
   ========================================= */

function getWeekKey() {

    const week = getWeekNumber();

    return `week-${week}`;

}


/* =========================================
   RENDER
   ========================================= */

function render() {

    const week = getWeekNumber();

    const dates = getWeekDates();

    document.getElementById("weekNumber").textContent =
        week;

    document.getElementById("weekPeriod").textContent =
        `${formatDate(dates.monday)} – ${formatDate(dates.saturday)}`;


    renderSubjects();

    updateOverallProgress();

    updateCountdown();

}


/* =========================================
   RENDER MAPEL
   ========================================= */

function renderSubjects() {

    const container =
        document.getElementById("subjectsContainer");

    container.innerHTML = "";

    const storage = getStorage();

    const weekKey = getWeekKey();

    if (!storage[weekKey]) {
        storage[weekKey] = {};
    }


    subjects.forEach(subject => {

        let tasks = currentWeekTasks[subject.id] || [];

        const subjectData =
            storage[weekKey][subject.id] || {};


        if (!storage[weekKey][subject.id]) {

            storage[weekKey][subject.id] = {};

            tasks.forEach((task, index) => {

                storage[weekKey][subject.id][index] = false;

            });

        }


        const card =
            document.createElement("div");

        card.className = "subject-card";


        const completed =
            tasks.filter(
                (_, index) =>
                    subjectData[index] === true
            ).length;


        const percentage =
            tasks.length === 0
                ? 0
                : Math.round(
                    (completed / tasks.length) * 100
                );


        card.innerHTML = `

            <div class="subject-head">

                <h3 class="subject-name">
                    ${subject.name}
                </h3>

                <span class="sks">
                    ${subject.sks} SKS
                </span>

            </div>


            <div class="subject-progress-info">

                <span>
                    ${completed}/${tasks.length} selesai
                </span>

                <span>
                    ${percentage}%
                </span>

            </div>


            <div class="subject-progress">

                <div
                    class="subject-progress-fill"
                    style="width:${percentage}%">
                </div>

            </div>


            <div class="task-list">

                ${
                    tasks.length
                    ?
                    tasks.map((task, index) => `

                        <label
                            class="task ${
                                subjectData[index]
                                    ? "done"
                                    : ""
                            }"
                        >

                            <input
                                type="checkbox"
                                data-subject="${subject.id}"
                                data-index="${index}"
                                ${
                                    subjectData[index]
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span class="checkbox"></span>

                            <span class="task-text">
                                ${task}
                            </span>

                        </label>

                    `).join("")

                    :

                    `
                        <div class="empty">
                            Tidak ada tugas minggu ini.
                        </div>
                    `
                }

            </div>

        `;


        container.appendChild(card);

    });


    saveStorage(storage);


    addCheckboxListeners();

}


/* =========================================
   CHECKBOX
   ========================================= */

function addCheckboxListeners() {

    const checkboxes =
        document.querySelectorAll(
            ".task input"
        );


    checkboxes.forEach(checkbox => {

        checkbox.addEventListener(
            "change",
            function () {

                const storage = getStorage();

                const weekKey = getWeekKey();

                const subject =
                    this.dataset.subject;

                const index =
                    this.dataset.index;


                if (!storage[weekKey]) {
                    storage[weekKey] = {};
                }


                if (!storage[weekKey][subject]) {
                    storage[weekKey][subject] = {};
                }


                storage[weekKey][subject][index] =
                    this.checked;


                saveStorage(storage);


                render();

            }
        );

    });

}


/* =========================================
   OVERALL PROGRESS
   ========================================= */

function updateOverallProgress() {

    const storage = getStorage();

    const weekKey = getWeekKey();

    let total = 0;
    let completed = 0;


    subjects.forEach(subject => {

        const tasks =
            currentWeekTasks[subject.id] || [];


        const subjectData =
            storage[weekKey]?.[subject.id] || {};


        total += tasks.length;


        tasks.forEach((_, index) => {

            if (subjectData[index] === true) {
                completed++;
            }

        });

    });


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    document.getElementById(
        "overallPercent"
    ).textContent = `${percentage}%`;


    document.getElementById(
        "overallProgress"
    ).style.width = `${percentage}%`;


    document.getElementById(
        "taskSummary"
    ).textContent =
        `${completed} dari ${total} tugas selesai`;


    const status =
        document.getElementById(
            "overallStatus"
        );


    if (percentage === 100) {

        status.textContent = "✓ Semua selesai";

    } else if (percentage >= 50) {

        status.textContent = "Lumayan, lanjut 🔥";

    } else if (percentage > 0) {

        status.textContent = "Sedang berjalan";

    } else {

        status.textContent = "Belum mulai";

    }


    const warning =
        document.getElementById(
            "warningBox"
        );


    if (percentage < 100) {
        warning.classList.remove("hidden");
    } else {
        warning.classList.add("hidden");
    }

}


/* =========================================
   COUNTDOWN SABTU
   ========================================= */

function updateCountdown() {

    const now = new Date();

    const dates = getWeekDates(now);

    const resetDate = new Date(
        dates.saturday
    );

    /*
       Reset dianggap mulai Sabtu 00:00
    */

    resetDate.setHours(0, 0, 0, 0);


    let difference =
        resetDate.getTime() -
        now.getTime();


    /*
       Kalau sudah masuk Sabtu,
       target diarahkan ke Sabtu berikutnya.
    */

    if (difference <= 0) {

        resetDate.setDate(
            resetDate.getDate() + 7
        );

        difference =
            resetDate.getTime() -
            now.getTime();

    }


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );


    const hours =
        Math.floor(
            (difference %
                (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        );


    const minutes =
        Math.floor(
            (difference %
                (1000 * 60 * 60)) /
            (1000 * 60)
        );


    document.getElementById(
        "countdown"
    ).textContent =
        `${days}h ${hours}j ${minutes}m`;

}


/* =========================================
   RESET DATA
   ========================================= */

document
    .getElementById("resetButton")
    .addEventListener(
        "click",
        function () {

            const yakin =
                confirm(
                    "Hapus semua progress minggu ini?"
                );


            if (!yakin) {
                return;
            }


            const storage = getStorage();

            const weekKey = getWeekKey();


            if (storage[weekKey]) {

                delete storage[weekKey];

            }


            saveStorage(storage);

            render();

        }
    );


/* =========================================
   AUTO UPDATE COUNTDOWN
   ========================================= */

setInterval(
    updateCountdown,
    60 * 1000
);


/* =========================================
   START
   ========================================= */

render();
