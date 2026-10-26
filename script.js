// ======================================================
// 날짜, 시간
// ======================================================

function updateDateTime() {

    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const todayDate = document.getElementById("today-date");
    const currentTime = document.getElementById("current-time");

    if (todayDate) {
        todayDate.textContent =
            `${year}년 ${month}월 ${date}일`;
    }

    if (currentTime) {
        currentTime.textContent =
            `${hours}:${minutes}:${seconds}`;
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);


// ======================================================
// 글귀
// ======================================================

const quotes = [
    "오늘도 나만의 속도로, 하나씩 해내면 충분해요.",
    "완벽하지 않아도 시작했다는 것만으로 충분해요.",
    "작은 한 걸음이 모여 큰 변화를 만들어요.",
    "모든 일을 한 번에 끝내지 않아도 괜찮아요.",
    "지금 할 수 있는 일부터 천천히 시작해 봐요.",
    "어제보다 조금씩 나아가고 있어요.",
    "잠깐 쉬어가도 괜찮아요. 다시 시작하면 되니까요.",
    "오늘의 작은 노력이 내일의 여유가 돼요.",
    "해야 할 일이 많아도 하나씩 보면 할 수 있어요.",
    "나에게 필요한 건 조급함보다 꾸준함이에요."
];

let quoteIndex = 0;

function changeQuote() {

    const quoteElement =
        document.querySelector(".quote-text");

    if (!quoteElement) {
        return;
    }

    quoteIndex =
        (quoteIndex + 1) % quotes.length;

    quoteElement.classList.remove("slide-in");

    void quoteElement.offsetWidth;

    quoteElement.textContent =
        quotes[quoteIndex];

    quoteElement.classList.add("slide-in");
}

setInterval(changeQuote, 60000);


// ======================================================
// 로그인 사용자 확인
// ======================================================

function getUserId() {

    const userId =
        localStorage.getItem("user_id");

    if (!userId) {
        return null;
    }

    return userId;
}


function getUsername() {

    return localStorage.getItem("username");
}


// ======================================================
// 달력
// ======================================================

const calendarTitle =
    document.getElementById("calendar-title");

const calendarGrid =
    document.getElementById("calendar-grid");

let calendarDate = new Date();
let selectedDate = new Date();


// ======================================================
// 일정 데이터
// ======================================================

let schedules = [];


// ======================================================
// 서버에서 일정 불러오기
// ======================================================

async function loadSchedules() {

    try {

        const userId =
            getUserId();

        if (!userId) {

            console.log(
                "로그인된 사용자가 없습니다."
            );

            schedules = [];

            renderCalendar();
            renderSchedules();
            renderScheduleFinder();

            return;
        }


        const response =
            await fetch(
                `/schedules?user_id=${encodeURIComponent(userId)}`
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "일정 데이터를 불러오지 못했습니다."
            );
        }


        schedules =
            result.schedules || [];


        renderCalendar();
        renderSchedules();
        renderScheduleFinder();


    } catch (error) {

        console.error(
            "일정 불러오기 오류:",
            error
        );

        schedules = [];

        renderCalendar();
        renderSchedules();
        renderScheduleFinder();
    }
}


// ======================================================
// 날짜를 YYYY-MM-DD 형식으로 변환
// ======================================================

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ======================================================
// 마감시간을 Date 객체로 변환
// ======================================================

function getDeadlineDate(schedule) {

    if (!schedule.deadline) {
        return null;
    }

    const deadline =
        new Date(schedule.deadline);

    if (isNaN(deadline.getTime())) {
        return null;
    }

    return deadline;
}


// ======================================================
// 우선순위 숫자
// ======================================================

function getPriorityScore(priority) {

    if (priority === "urgent") {
        return 3;
    }

    if (priority === "important") {
        return 2;
    }

    return 1;
}


// ======================================================
// 일정 정렬
// ======================================================

function compareSchedules(a, b) {

    // 완료된 일정은 아래쪽
    if (a.completed !== b.completed) {

        return a.completed
            ? 1
            : -1;
    }


    // 마감시간이 있으면 마감시간 기준
    const deadlineA =
        getDeadlineDate(a);

    const deadlineB =
        getDeadlineDate(b);


    if (
        deadlineA &&
        deadlineB
    ) {

        const deadlineDifference =
            deadlineA.getTime() -
            deadlineB.getTime();


        if (deadlineDifference !== 0) {
            return deadlineDifference;
        }
    }


    // 마감시간이 없는 일정은 뒤쪽
    if (deadlineA && !deadlineB) {
        return -1;
    }

    if (!deadlineA && deadlineB) {
        return 1;
    }


    // 같은 마감시간이면 중요도
    const priorityDifference =
        getPriorityScore(b.priority) -
        getPriorityScore(a.priority);


    if (priorityDifference !== 0) {
        return priorityDifference;
    }


    // 마지막으로 날짜
    return (
        String(a.date || "")
            .localeCompare(
                String(b.date || "")
            )
    );
}


// ======================================================
// 달력 표시
// ======================================================

function renderCalendar() {

    if (
        !calendarGrid ||
        !calendarTitle
    ) {
        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    calendarTitle.textContent =
        `${year}년 ${month + 1}월`;


    // 기존 날짜 버튼 제거
    calendarGrid
        .querySelectorAll(".calendar-day")
        .forEach(
            day => day.remove()
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    // 월요일 시작
    const startDay =
        (firstDay.getDay() + 6) % 7;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    const today =
        new Date();


    // 6주 × 7일 = 42칸
    for (
        let i = 0;
        i < 42;
        i++
    ) {

        let dayNumber;
        let dayDate;
        let isOtherMonth = false;


        // 이전 달
        if (i < startDay) {

            dayNumber =
                previousMonthDays -
                startDay +
                i +
                1;


            dayDate =
                new Date(
                    year,
                    month - 1,
                    dayNumber
                );


            isOtherMonth = true;


        // 다음 달
        } else if (
            i >=
            startDay +
            daysInMonth
        ) {

            dayNumber =
                i -
                startDay -
                daysInMonth +
                1;


            dayDate =
                new Date(
                    year,
                    month + 1,
                    dayNumber
                );


            isOtherMonth = true;


        // 현재 달
        } else {

            dayNumber =
                i -
                startDay +
                1;


            dayDate =
                new Date(
                    year,
                    month,
                    dayNumber
                );
        }


        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "calendar-day";

        button.textContent =
            dayNumber;


        // 다른 달
        if (isOtherMonth) {

            button.classList.add(
                "other-month"
            );
        }


        // 오늘
        if (
            dayDate.toDateString() ===
            today.toDateString()
        ) {

            button.classList.add(
                "today"
            );
        }


        // 선택된 날짜
        if (
            dayDate.toDateString() ===
            selectedDate.toDateString()
        ) {

            button.classList.add(
                "selected"
            );
        }


        // 일정 표시
        const dayDateString =
            formatDate(dayDate);


        const daySchedules =
            schedules.filter(
                schedule =>
                    schedule.date ===
                    dayDateString
            );


        if (
            daySchedules.length > 0
        ) {

            const dotContainer =
                document.createElement(
                    "div"
                );


            dotContainer.className =
                "schedule-dots";


            daySchedules.forEach(
                schedule => {

                    const dot =
                        document.createElement(
                            "span"
                        );


                    dot.className =
                        "schedule-dot";


                    dot.style.backgroundColor =
                        schedule.color ||
                        "#C9A98A";


                    dotContainer.appendChild(
                        dot
                    );
                }
            );


            button.appendChild(
                dotContainer
            );
        }


        // 날짜 클릭
        button.addEventListener(
            "click",
            () => {

                selectedDate =
                    new Date(dayDate);


                calendarDate =
                    new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        1
                    );


                renderCalendar();

                openDateScheduleModal(
                    selectedDate
                );
            }
        );


        calendarGrid.appendChild(
            button
        );
    }
}


// ======================================================
// 선택한 날짜 일정창
// ======================================================

function openDateScheduleModal(date) {

    const dateModal =
        document.getElementById(
            "date-schedule-modal"
        );


    const title =
        document.getElementById(
            "date-schedule-title"
        );


    const list =
        document.getElementById(
            "date-schedule-list"
        );


    if (
        !dateModal ||
        !title ||
        !list
    ) {
        return;
    }


    const dateString =
        formatDate(date);


    title.textContent =
        `${date.getMonth() + 1}월 ${date.getDate()}일 일정`;


    list.replaceChildren();


    const dateSchedules =
        schedules
            .filter(
                schedule =>
                    schedule.date ===
                    dateString
            )
            .sort(compareSchedules);


    if (
        dateSchedules.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.className =
            "schedule-empty";


        emptyMessage.textContent =
            "이 날짜에는 일정이 없습니다.";


        list.appendChild(
            emptyMessage
        );
    }


    dateSchedules.forEach(
        schedule => {

            list.appendChild(
                createScheduleItem(
                    schedule
                )
            );
        }
    );


    dateModal.style.display =
        "flex";
}


// ======================================================
// 날짜 일정창 닫기
// ======================================================

const closeDateScheduleButton =
    document.getElementById(
        "close-date-schedule"
    );


if (closeDateScheduleButton) {

    closeDateScheduleButton.addEventListener(
        "click",
        () => {

            const modal =
                document.getElementById(
                    "date-schedule-modal"
                );


            if (modal) {

                modal.style.display =
                    "none";
            }
        }
    );
}


// ======================================================
// 선택한 날짜에 일정 추가
// ======================================================

const dateAddScheduleButton =
    document.getElementById(
        "date-add-schedule"
    );


if (dateAddScheduleButton) {

    dateAddScheduleButton.addEventListener(
        "click",
        () => {

            const userId =
                getUserId();


            if (!userId) {

                alert(
                    "일정을 추가하려면 로그인이 필요합니다."
                );

                return;
            }


            const dateModal =
                document.getElementById(
                    "date-schedule-modal"
                );


            if (dateModal) {

                dateModal.style.display =
                    "none";
            }


            if (scheduleModal) {

                scheduleModal.style.display =
                    "flex";
            }


            if (scheduleDateInput) {

                scheduleDateInput.value =
                    formatDate(
                        selectedDate
                    );
            }
        }
    );
}


// ======================================================
// 이전 달
// ======================================================

const prevMonthButton =
    document.getElementById(
        "prev-month"
    );


if (prevMonthButton) {

    prevMonthButton.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() - 1
            );

            renderCalendar();
        }
    );
}


// ======================================================
// 다음 달
// ======================================================

const nextMonthButton =
    document.getElementById(
        "next-month"
    );


if (nextMonthButton) {

    nextMonthButton.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() + 1
            );

            renderCalendar();
        }
    );
}


// ======================================================
// 내 일정 찾기
// ======================================================

const scheduleSearchInput =
    document.getElementById(
        "schedule-search"
    );


const selectedDateLabel =
    document.getElementById(
        "selected-date-label"
    );


const scheduleSearchResults =
    document.getElementById(
        "schedule-search-results"
    );


function getSelectedDateText(date) {

    return `${date.getFullYear()}년 ${
        date.getMonth() + 1
    }월 ${date.getDate()}일`;
}


function normalizeSearchText(text) {

    return String(text || "")
        .replace(/\s+/g, "")
        .toLowerCase();
}


function renderScheduleFinder() {

    if (
        !scheduleSearchInput ||
        !selectedDateLabel ||
        !scheduleSearchResults
    ) {
        return;
    }


    const keyword =
        normalizeSearchText(
            scheduleSearchInput.value
        );


    if (!keyword) {

        selectedDateLabel.textContent =
            "";

        scheduleSearchResults.replaceChildren();

        return;
    }


    selectedDateLabel.textContent =
        "검색 결과";


    scheduleSearchResults.replaceChildren();


    const results =
        schedules
            .filter(
                schedule =>
                    normalizeSearchText(
                        schedule.title
                    ).includes(keyword)
            )
            .sort(compareSchedules);


    if (
        results.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.className =
            "schedule-search-empty";


        emptyMessage.textContent =
            "검색 결과가 없습니다.";


        scheduleSearchResults.appendChild(
            emptyMessage
        );


        return;
    }


    results.forEach(
        schedule => {

            scheduleSearchResults.appendChild(
                createScheduleItem(
                    schedule
                )
            );
        }
    );
}


if (scheduleSearchInput) {

    scheduleSearchInput.addEventListener(
        "input",
        renderScheduleFinder
    );
}


// ======================================================
// 마감일까지 남은 시간
// ======================================================

function getDeadlineRemaining(deadline) {

    const now =
        new Date();


    const end =
        new Date(deadline);


    if (isNaN(end.getTime())) {

        return "마감시간 확인 필요";
    }


    const diff =
        end.getTime() -
        now.getTime();


    if (diff < 0) {

        return "마감일 지남";
    }


    const totalMinutes =
        Math.floor(
            diff /
            (1000 * 60)
        );


    const days =
        Math.floor(
            totalMinutes /
            (60 * 24)
        );


    const hours =
        Math.floor(
            (totalMinutes %
                (60 * 24)) /
            60
        );


    const minutes =
        totalMinutes % 60;


    if (days > 0) {

        return `${days}일 ${hours}시간 ${minutes}분 남음`;
    }


    if (hours > 0) {

        return `${hours}시간 ${minutes}분 남음`;
    }


    return `${minutes}분 남음`;
}


// ======================================================
// 이번 주인지 확인
// ======================================================

function isThisWeek(dateString) {

    if (!dateString) {
        return false;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const monday =
        new Date(today);


    const dayOfWeek =
        (today.getDay() + 6) % 7;


    monday.setDate(
        today.getDate() -
        dayOfWeek
    );


    const nextMonday =
        new Date(monday);


    nextMonday.setDate(
        monday.getDate() + 7
    );


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return (
        date >= monday &&
        date < nextMonday
    );
}


// ======================================================
// 마감 경고 아이콘 생성
// ======================================================

function createDeadlineWarning(schedule) {

    if (!schedule.deadline) {
        return null;
    }


    const deadlineDate =
        getDeadlineDate(schedule);


    if (!deadlineDate) {
        return null;
    }


    const now =
        new Date();


    const diff =
        deadlineDate.getTime() -
        now.getTime();


    const warning =
        document.createElement(
            "span"
        );


    warning.className =
        "material-symbols-outlined deadline-warning";


    warning.textContent =
        "warning";


    // 마감 지남
    if (diff < 0) {

        warning.style.color =
            "#8B8177";

    // 7일 이상
    } else if (
        diff >=
        7 * 24 * 60 * 60 * 1000
    ) {

        warning.style.color =
            "#4F9368";

    // 3일 이상
    } else if (
        diff >=
        3 * 24 * 60 * 60 * 1000
    ) {

        warning.style.color =
            "#D6A52D";

    // 3일 미만
    } else {

        warning.style.color =
            "#C94C43";
    }


    return warning;
}


// ======================================================
// 일정 하나 표시
// ======================================================

function createScheduleItem(schedule) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "schedule-item";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "schedule-info";


    // ==================================================
    // 제목
    // ==================================================

    const title =
        document.createElement(
            "div"
        );


    title.className =
        "schedule-item-title";


    const colorDot =
        document.createElement(
            "span"
        );


    colorDot.className =
        "schedule-color-dot";


    colorDot.style.backgroundColor =
        schedule.color ||
        "#C9B8A6";


    title.appendChild(
        colorDot
    );


    const titleText =
        document.createElement(
            "span"
        );


    titleText.textContent =
        schedule.title || "제목 없음";


    title.appendChild(
        titleText
    );


    info.appendChild(
        title
    );


    // ==================================================
    // 시작일
    // ==================================================

    const date =
        document.createElement(
            "div"
        );


    date.className =
        "schedule-item-date";


    date.textContent =
        schedule.date
            ? schedule.date.replaceAll(
                "-",
                "."
            )
            : "";


    info.appendChild(
        date
    );


    // ==================================================
    // 마감일
    // ==================================================

    if (schedule.deadline) {

        const deadline =
            document.createElement(
                "div"
            );


        deadline.className =
            "schedule-item-deadline";


        const deadlineDate =
            getDeadlineDate(schedule);


        if (deadlineDate) {

            const year =
                deadlineDate.getFullYear();


            const month =
                String(
                    deadlineDate.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            const day =
                String(
                    deadlineDate.getDate()
                ).padStart(
                    2,
                    "0"
                );


            const hours =
                String(
                    deadlineDate.getHours()
                ).padStart(
                    2,
                    "0"
                );


            const minutes =
                String(
                    deadlineDate.getMinutes()
                ).padStart(
                    2,
                    "0"
                );


            deadline.textContent =
                `마감일: ${year}.${month}.${day} ${hours}:${minutes}`;

        } else {

            deadline.textContent =
                "마감시간 확인 필요";
        }


        info.appendChild(
            deadline
        );
    }


    // ==================================================
    // 중요도
    // ==================================================

    const priority =
        document.createElement(
            "span"
        );


    priority.className =
        "schedule-priority";


    if (
        schedule.priority ===
        "urgent"
    ) {

        priority.textContent =
            "매우 중요";

    } else if (
        schedule.priority ===
        "important"
    ) {

        priority.textContent =
            "중요";

    } else {

        priority.textContent =
            "보통";
    }


    info.appendChild(
        priority
    );


    // ==================================================
    // 메모
    // ==================================================

    if (schedule.memo) {

        const memo =
            document.createElement(
                "div"
            );


        memo.className =
            "schedule-item-memo";


        memo.textContent =
            schedule.memo;


        info.appendChild(
            memo
        );
    }


    // ==================================================
    // 완료 상태
    // ==================================================

    if (schedule.completed) {

        item.classList.add(
            "completed-schedule"
        );
    }


    item.appendChild(
        info
    );


    // ==================================================
    // 클릭 → 상세정보
    // ==================================================

    item.addEventListener(
        "click",
        () => {

            openScheduleDetail(
                schedule
            );
        }
    );


    return item;
}


// ======================================================
// 전체 일정 / 이번 주 / 오늘
// ======================================================

function renderSchedules() {

    const allList =
        document.querySelector(
            ".all-schedule-list"
        );


    const weekList =
        document.querySelector(
            ".week-schedule-list"
        );


    const todayList =
        document.querySelector(
            ".today-priority-list"
        );


    if (
        !allList ||
        !weekList ||
        !todayList
    ) {
        return;
    }


    allList.replaceChildren();

    weekList.replaceChildren();

    todayList.replaceChildren();


    // ==================================================
    // 전체 일정
    // ==================================================

    const sortedSchedules =
        [...schedules].sort(
            compareSchedules
        );


    sortedSchedules.forEach(
        schedule => {

            allList.appendChild(
                createScheduleItem(
                    schedule
                )
            );


            if (
                isThisWeek(
                    schedule.date
                )
            ) {

                weekList.appendChild(
                    createScheduleItem(
                        schedule
                    )
                );
            }
        }
    );


    // ==================================================
    // 오늘 일정
    // ==================================================

    const today =
        formatDate(
            new Date()
        );


    const todaySchedules =
        schedules
            .filter(
                schedule =>
                    schedule.date ===
                    today
            )
            .sort(
                compareSchedules
            );


    todaySchedules.forEach(
        schedule => {

            const item =
                createScheduleItem(
                    schedule
                );


            // 완료된 일정은 우선순위 영역에서
            // 완료 상태를 확실히 표시
            if (schedule.completed) {

                item.classList.add(
                    "completed-schedule"
                );
            }


            // 마감 경고 + 남은 시간
            if (schedule.deadline) {

                const deadlineInfo =
                    document.createElement(
                        "div"
                    );


                deadlineInfo.className =
                    "deadline-countdown";


                const warning =
                    createDeadlineWarning(
                        schedule
                    );


                if (warning) {

                    deadlineInfo.appendChild(
                        warning
                    );
                }


                const deadlineText =
                    document.createElement(
                        "span"
                    );


                deadlineText.textContent =
                    "마감일: " +
                    getDeadlineRemaining(
                        schedule.deadline
                    );


                deadlineInfo.appendChild(
                    deadlineText
                );


                item.appendChild(
                    deadlineInfo
                );
            }


            todayList.appendChild(
                item
            );
        }
    );


    // ==================================================
    // 오늘 일정 없음
    // ==================================================

    if (
        todayList.children.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.className =
            "schedule-empty";


        emptyMessage.textContent =
            "오늘 할 일이 없습니다.";


        todayList.appendChild(
            emptyMessage
        );
    }


    // ==================================================
    // 전체 일정 없음
    // ==================================================

    if (
        allList.children.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.className =
            "schedule-empty";


        emptyMessage.textContent =
            "등록된 일정이 없습니다.";


        allList.appendChild(
            emptyMessage
        );
    }


    // ==================================================
    // 이번 주 일정 없음
    // ==================================================

    if (
        weekList.children.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.className =
            "schedule-empty";


        emptyMessage.textContent =
            "이번 주 일정이 없습니다.";


        weekList.appendChild(
            emptyMessage
        );
    }


    // ==================================================
    // 이번 주 진행률
    // ==================================================

    const thisWeekSchedules =
        schedules.filter(
            schedule =>
                isThisWeek(
                    schedule.date
                )
        );


    const totalCount =
        thisWeekSchedules.length;


    const completedCount =
        thisWeekSchedules.filter(
            schedule =>
                schedule.completed
        ).length;


    const progress =
        totalCount === 0
            ? 0
            : Math.round(
                (completedCount /
                    totalCount) *
                100
            );


    const progressPercent =
        document.getElementById(
            "weekly-progress-percent"
        );


    const progressFill =
        document.getElementById(
            "weekly-progress-fill"
        );


    const progressCount =
        document.getElementById(
            "weekly-progress-count"
        );


    const progressMessage =
        document.getElementById(
            "weekly-progress-message"
        );


    if (progressPercent) {

        progressPercent.textContent =
            `${progress}%`;
    }


    if (progressFill) {

        progressFill.style.width =
            `${progress}%`;
    }


    if (progressCount) {

        progressCount.textContent =
            `${completedCount} / ${totalCount}개 완료`;
    }


    if (progressMessage) {

        if (totalCount === 0) {

            progressMessage.textContent =
                "이번 주 일정을 등록해 보세요!";

        } else if (
            progress === 100
        ) {

            progressMessage.textContent =
                "이번 주 목표를 모두 달성했어요!";

        } else if (
            progress >= 50
        ) {

            progressMessage.textContent =
                "절반 이상 해냈어요! 조금만 더 힘내요 ☕";

        } else {

            progressMessage.textContent =
                "이번 주 목표를 향해 가는 중이에요";
        }
    }
}


// ======================================================
// 일정 추가 모달
// ======================================================

const scheduleModal =
    document.getElementById(
        "schedule-modal"
    );


const addScheduleButton =
    document.querySelector(
        ".add-schedule-btn"
    );


const closeModalButton =
    document.getElementById(
        "close-modal"
    );


const cancelModalButton =
    document.getElementById(
        "cancel-modal"
    );


if (addScheduleButton) {

    addScheduleButton.addEventListener(
        "click",
        () => {

            const userId =
                getUserId();


            if (!userId) {

                alert(
                    "일정을 추가하려면 로그인이 필요합니다."
                );

                return;
            }


            // 새 일정 입력창 초기화
            resetScheduleForm();


            scheduleModal.style.display =
                "flex";
        }
    );
}


if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        () => {

            scheduleModal.style.display =
                "none";
        }
    );
}


if (cancelModalButton) {

    cancelModalButton.addEventListener(
        "click",
        () => {

            scheduleModal.style.display =
                "none";
        }
    );
}


// 배경 클릭
if (scheduleModal) {

    scheduleModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                scheduleModal
            ) {

                scheduleModal.style.display =
                    "none";
            }
        }
    );
}


// ======================================================
// 입력 요소
// ======================================================

const saveScheduleButton =
    document.getElementById(
        "save-schedule"
    );


const scheduleTitleInput =
    document.getElementById(
        "schedule-title"
    );


const scheduleDateInput =
    document.getElementById(
        "schedule-date"
    );


const scheduleDeadlineInput =
    document.getElementById(
        "schedule-deadline"
    );


const scheduleDeadlineAmPmInput =
    document.getElementById(
        "schedule-deadline-ampm"
    );


const scheduleDeadlineHourInput =
    document.getElementById(
        "schedule-deadline-hour"
    );


const scheduleDeadlineMinuteInput =
    document.getElementById(
        "schedule-deadline-minute"
    );


const schedulePriorityInput =
    document.getElementById(
        "schedule-priority"
    );


const scheduleMemoInput =
    document.getElementById(
        "schedule-memo"
    );


const scheduleColorInput =
    document.getElementById(
        "schedule-color"
    );


// ======================================================
// 일정 입력창 초기화
// ======================================================

function resetScheduleForm() {

    if (scheduleTitleInput) {
        scheduleTitleInput.value = "";
    }

    if (scheduleDateInput) {
        scheduleDateInput.value = "";
    }

    if (scheduleDeadlineInput) {
        scheduleDeadlineInput.value = "";
    }

    if (scheduleDeadlineAmPmInput) {
        scheduleDeadlineAmPmInput.value = "AM";
    }

    if (scheduleDeadlineHourInput) {
        scheduleDeadlineHourInput.value = "";
    }

    if (scheduleDeadlineMinuteInput) {
        scheduleDeadlineMinuteInput.value = "";
    }

    if (schedulePriorityInput) {
        schedulePriorityInput.value = "normal";
    }

    if (scheduleMemoInput) {
        scheduleMemoInput.value = "";
    }

    if (scheduleColorInput) {
        scheduleColorInput.value =
            "#D9A6A6";
    }
}


// ======================================================
// 시간 입력값 검사
// ======================================================

function validateDeadlineTime() {

    if (
        !scheduleDeadlineInput ||
        !scheduleDeadlineHourInput ||
        !scheduleDeadlineMinuteInput
    ) {
        return true;
    }


    // 마감 날짜가 없으면 검사하지 않음
    if (
        !scheduleDeadlineInput.value
    ) {
        return true;
    }


    const hourText =
        scheduleDeadlineHourInput.value.trim();


    const minuteText =
        scheduleDeadlineMinuteInput.value.trim();


    // 시와 분을 둘 다 입력하도록 함
    if (
        !hourText ||
        !minuteText
    ) {

        alert(
            "마감 시간을 시와 분까지 입력해 주세요."
        );

        return false;
    }


    const hour =
        Number(hourText);


    const minute =
        Number(minuteText);


    if (
        !Number.isInteger(hour) ||
        hour < 1 ||
        hour > 12
    ) {

        alert(
            "시간은 1시부터 12시까지 입력해 주세요."
        );

        scheduleDeadlineHourInput.focus();

        return false;
    }


    if (
        !Number.isInteger(minute) ||
        minute < 0 ||
        minute > 59
    ) {

        alert(
            "분은 0분부터 59분까지 입력해 주세요."
        );

        scheduleDeadlineMinuteInput.focus();

        return false;
    }


    return true;
}


// ======================================================
// 일정 저장
// ======================================================

if (saveScheduleButton) {

    saveScheduleButton.addEventListener(
        "click",
        async () => {

            const userId =
                getUserId();


            // 로그인 확인
            if (!userId) {

                alert(
                    "로그인이 필요합니다."
                );

                if (loginModal) {
                    loginModal.style.display =
                        "flex";
                }

                return;
            }


            const title =
                scheduleTitleInput.value.trim();


            const date =
                scheduleDateInput.value;


            // 제목 검사
            if (!title) {

                alert(
                    "일정 제목을 입력해 주세요."
                );

                scheduleTitleInput.focus();

                return;
            }


            // 날짜 검사
            if (!date) {

                alert(
                    "날짜를 선택해 주세요."
                );

                scheduleDateInput.focus();

                return;
            }


            // 마감시간 검사
            if (!validateDeadlineTime()) {
                return;
            }


            // ==================================================
            // 마감일 + 시간
            // ==================================================

            let deadlineDate = "";
            let deadlineAmPm = "";
            let deadlineHour = null;
            let deadlineMinute = null;


            if (
                scheduleDeadlineInput.value
            ) {

                deadlineDate =
                    scheduleDeadlineInput.value;


                deadlineAmPm =
                    scheduleDeadlineAmPmInput.value ||
                    "AM";


                deadlineHour =
                    Number(
                        scheduleDeadlineHourInput.value
                    );


                deadlineMinute =
                    Number(
                        scheduleDeadlineMinuteInput.value
                    );
            }


            // ==================================================
            // 색상
            // ==================================================

            const color =
                scheduleColorInput
                    ? scheduleColorInput.value
                    : "#D9A6A6";


            // ==================================================
            // 서버에 보낼 데이터
            // ==================================================

            const scheduleData = {

                user_id:
                    Number(userId),

                title:
                    title,

                date:
                    date,

                deadline_date:
                    deadlineDate,

                deadline_ampm:
                    deadlineAmPm,

                deadline_hour:
                    deadlineHour,

                deadline_minute:
                    deadlineMinute,

                priority:
                    schedulePriorityInput.value,

                color:
                    color,

                memo:
                    scheduleMemoInput.value.trim()
            };


            console.log(
                "서버로 보내는 일정 데이터:",
                scheduleData
            );


            try {

                const response =
                    await fetch(
                        "/schedules",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    scheduleData
                                )
                        }
                    );


                const result =
                    await response.json();


                console.log(
                    "서버 응답:",
                    result
                );


                if (
                    response.ok &&
                    result.success
                ) {

                    alert(
                        "일정이 저장되었습니다."
                    );


                    // 서버에서 최신 일정 불러오기
                    await loadSchedules();


                    // 입력창 초기화
                    resetScheduleForm();


                    // 모달 닫기
                    scheduleModal.style.display =
                        "none";


                } else {

                    alert(
                        result.message ||
                        "일정 저장에 실패했습니다."
                    );
                }


            } catch (error) {

                console.error(
                    "일정 저장 오류:",
                    error
                );


                alert(
                    "일정 저장 중 오류가 발생했습니다."
                );
            }
        }
    );
}


// ======================================================
// 일정 상세정보
// ======================================================

const detailModal =
    document.getElementById(
        "detail-modal"
    );


const closeDetailButton =
    document.getElementById(
        "close-detail-button"
    );


const deleteScheduleButton =
    document.getElementById(
        "delete-schedule"
    );


let selectedSchedule = null;


// ======================================================
// 상세정보 표시
// ======================================================

function openScheduleDetail(schedule) {

    selectedSchedule =
        schedule;


    const detailDate =
        document.getElementById(
            "detail-date"
        );


    const detailTitle =
        document.getElementById(
            "detail-title"
        );


    const detailPriority =
        document.getElementById(
            "detail-priority"
        );


    const detailMemo =
        document.getElementById(
            "detail-memo"
        );


    const detailDeadline =
        document.getElementById(
            "detail-deadline"
        );


    if (detailDate) {

        detailDate.textContent =
            schedule.date
                ? schedule.date.replaceAll(
                    "-",
                    "."
                )
                : "";
    }


    if (detailTitle) {

        detailTitle.textContent =
            schedule.title || "";
    }


    const priorityText = {

        normal: "보통",

        important: "중요",

        urgent: "매우 중요"
    };


    if (detailPriority) {

        detailPriority.textContent =
            priorityText[
                schedule.priority
            ] || "보통";
    }


    if (detailMemo) {

        detailMemo.textContent =
            schedule.memo ||
            "등록된 메모가 없습니다.";
    }


    // ==================================================
    // 마감기한
    // ==================================================

    if (
        detailDeadline
    ) {

        if (schedule.deadline) {

            const deadlineDate =
                getDeadlineDate(
                    schedule
                );


            if (deadlineDate) {

                const year =
                    deadlineDate.getFullYear();


                const month =
                    String(
                        deadlineDate.getMonth() + 1
                    ).padStart(
                        2,
                        "0"
                    );


                const day =
                    String(
                        deadlineDate.getDate()
                    ).padStart(
                        2,
                        "0"
                    );


                const hours =
                    String(
                        deadlineDate.getHours()
                    ).padStart(
                        2,
                        "0"
                    );


                const minutes =
                    String(
                        deadlineDate.getMinutes()
                    ).padStart(
                        2,
                        "0"
                    );


                detailDeadline.textContent =
                    `${year}.${month}.${day} ` +
                    `${hours}:${minutes} ` +
                    `(마감까지 ${getDeadlineRemaining(
                        schedule.deadline
                    )})`;

            } else {

                detailDeadline.textContent =
                    "마감시간 확인 필요";
            }

        } else {

            detailDeadline.textContent =
                "마감기한 없음";
        }
    }


    // 완료 상태에 따라 버튼 글자 변경
    if (completeScheduleButton) {

        completeScheduleButton.textContent =
            schedule.completed
                ? "완료 취소"
                : "완료";
    }


    if (detailModal) {

        detailModal.style.display =
            "flex";
    }
}


// ======================================================
// 일정 완료
// ======================================================

const completeScheduleButton =
    document.getElementById(
        "complete-schedule-button"
    );


if (completeScheduleButton) {

    completeScheduleButton.addEventListener(
        "click",
        async () => {

            if (!selectedSchedule) {
                return;
            }


            const userId =
                getUserId();


            if (!userId) {

                alert(
                    "로그인이 필요합니다."
                );

                return;
            }


            const newCompleted =
                !selectedSchedule.completed;


            try {

                const response =
                    await fetch(
                        `/schedules/${selectedSchedule.schedule_id}/complete`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    user_id:
                                        Number(userId),

                                    completed:
                                        newCompleted
                                })
                        }
                    );


                const result =
                    await response.json();


                if (
                    response.ok &&
                    result.success
                ) {

                    closeScheduleDetail();

                    await loadSchedules();

                } else {

                    alert(
                        result.message ||
                        "완료 상태 변경에 실패했습니다."
                    );
                }


            } catch (error) {

                console.error(
                    "완료 처리 오류:",
                    error
                );


                alert(
                    "서버에 연결할 수 없습니다."
                );
            }
        }
    );
}


// ======================================================
// 상세정보 닫기
// ======================================================

function closeScheduleDetail() {

    if (detailModal) {

        detailModal.style.display =
            "none";
    }

    selectedSchedule =
        null;
}


if (closeDetailButton) {

    closeDetailButton.addEventListener(
        "click",
        closeScheduleDetail
    );
}


// 배경 클릭
if (detailModal) {

    detailModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                detailModal
            ) {

                closeScheduleDetail();
            }
        }
    );
}


// ======================================================
// 일정 삭제
// ======================================================

if (deleteScheduleButton) {

    deleteScheduleButton.addEventListener(
        "click",
        async () => {

            if (!selectedSchedule) {
                return;
            }


            const userId =
                getUserId();


            if (!userId) {

                alert(
                    "로그인이 필요합니다."
                );

                return;
            }


            const confirmed =
                confirm(
                    `"${selectedSchedule.title}" 일정을 삭제할까요?`
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `/schedules/${selectedSchedule.schedule_id}?user_id=${encodeURIComponent(userId)}`,
                        {
                            method: "DELETE"
                        }
                    );


                const result =
                    await response.json();


                if (
                    response.ok &&
                    result.success
                ) {

                    alert(
                        "일정이 삭제되었습니다."
                    );


                    closeScheduleDetail();

                    await loadSchedules();

                } else {

                    alert(
                        result.message ||
                        "일정 삭제에 실패했습니다."
                    );
                }


            } catch (error) {

                console.error(
                    "일정 삭제 오류:",
                    error
                );


                alert(
                    "서버에 연결할 수 없습니다."
                );
            }
        }
    );
}


// ======================================================
// 로그인 / 회원가입 창
// ======================================================

// ======================================================
// 로그아웃
// ======================================================

function logout() {

    const confirmed =
        confirm("로그아웃하시겠습니까?");

    if (!confirmed) {
        return;
    }

    // 로그인 정보 삭제
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");

    // 일정 데이터 초기화
    schedules = [];

    // 화면 갱신
    renderCalendar();
    renderSchedules();
    renderScheduleFinder();

    // 로그인 영역을 로그인 전 상태로 변경
    const loginArea =
        document.getElementById(
            "login-area"
        );

    if (loginArea) {

        loginArea.innerHTML = `
            <button
                type="button"
                id="login-button"
                class="login-button"
            >
                로그인하기
            </button>
        `;

        // 로그인 버튼 이벤트 다시 연결
        const newLoginButton =
            document.getElementById(
                "login-button"
            );

        if (newLoginButton) {

            newLoginButton.addEventListener(
                "click",
                () => {

                    if (loginModal) {

                        loginModal.style.display =
                            "flex";
                    }
                }
            );
        }
    }

    alert("로그아웃되었습니다.");
}

const loginButton =
    document.getElementById(
        "login-button"
    );


const loginModal =
    document.getElementById(
        "login-modal"
    );


const closeLoginModal =
    document.getElementById(
        "close-login-modal"
    );


const signupButton =
    document.getElementById(
        "signup-button"
    );


const signupModal =
    document.getElementById(
        "signup-modal"
    );


const closeSignupModal =
    document.getElementById(
        "close-signup-modal"
    );


// ======================================================
// 로그인하기 클릭
// ======================================================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        () => {

            if (loginModal) {

                loginModal.style.display =
                    "flex";
            }
        }
    );
}


// ======================================================
// 로그인창 닫기
// ======================================================

if (closeLoginModal) {

    closeLoginModal.addEventListener(
        "click",
        () => {

            if (loginModal) {

                loginModal.style.display =
                    "none";
            }
        }
    );
}


// ======================================================
// 회원가입 클릭
// ======================================================

if (signupButton) {

    signupButton.addEventListener(
        "click",
        () => {

            if (loginModal) {

                loginModal.style.display =
                    "none";
            }


            if (signupModal) {

                signupModal.style.display =
                    "flex";
            }
        }
    );
}


// ======================================================
// 회원가입창 닫기
// ======================================================

if (closeSignupModal) {

    closeSignupModal.addEventListener(
        "click",
        () => {

            if (signupModal) {

                signupModal.style.display =
                    "none";
            }
        }
    );
}


// ======================================================
// 로그인창 바깥쪽 클릭
// ======================================================

if (loginModal) {

    loginModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                loginModal
            ) {

                loginModal.style.display =
                    "none";
            }
        }
    );
}


// ======================================================
// 회원가입창 바깥쪽 클릭
// ======================================================

if (signupModal) {

    signupModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                signupModal
            ) {

                signupModal.style.display =
                    "none";
            }
        }
    );
}


// ======================================================
// 회원가입
// ======================================================

const signupSubmit =
    document.getElementById(
        "signup-submit"
    );


if (signupSubmit) {

    signupSubmit.addEventListener(
        "click",
        async () => {

            const username =
                document.getElementById(
                    "signup-id"
                ).value.trim();


            const password =
                document.getElementById(
                    "signup-password"
                ).value;


            if (
                !username ||
                !password
            ) {

                alert(
                    "아이디와 비밀번호를 입력해주세요."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        "/signup",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    username:
                                        username,

                                    password:
                                        password
                                })
                        }
                    );


                const result =
                    await response.json();


                if (
                    response.ok &&
                    result.success
                ) {

                    alert(
                        "회원가입이 완료되었습니다."
                    );


                    if (signupModal) {

                        signupModal.style.display =
                            "none";
                    }


                    document.getElementById(
                        "signup-id"
                    ).value = "";


                    document.getElementById(
                        "signup-password"
                    ).value = "";

                } else {

                    alert(
                        result.message ||
                        "회원가입에 실패했습니다."
                    );
                }


            } catch (error) {

                console.error(
                    "회원가입 오류:",
                    error
                );


                alert(
                    "서버에 연결할 수 없습니다."
                );
            }
        }
    );
}


// ======================================================
// 로그인
// ======================================================

const loginSubmit =
    document.getElementById(
        "login-submit"
    );


if (loginSubmit) {

    loginSubmit.addEventListener(
        "click",
        async () => {

            const username =
                document.getElementById(
                    "login-id"
                ).value.trim();


            const password =
                document.getElementById(
                    "login-password"
                ).value;


            // 입력 확인
            if (
                !username ||
                !password
            ) {

                alert(
                    "아이디와 비밀번호를 입력해주세요."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        "/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    username:
                                        username,

                                    password:
                                        password
                                })
                        }
                    );


                const result =
                    await response.json();


                if (
                    response.ok &&
                    result.success
                ) {

                    alert(
                        "로그인되었습니다."
                    );


                    // 로그인 정보 저장
                    localStorage.setItem(
                        "user_id",
                        String(
                            result.user_id
                        )
                    );


                    localStorage.setItem(
                        "username",
                        result.username
                    );


                    console.log(
                        "로그인 user_id:",
                        localStorage.getItem(
                            "user_id"
                        )
                    );


                    // 로그인창 닫기
                    if (loginModal) {

                        loginModal.style.display =
                            "none";
                    }


                    // 로그인 입력창 초기화
                    document.getElementById(
                        "login-id"
                    ).value = "";


                    document.getElementById(
                        "login-password"
                    ).value = "";


                    // 상단 로그인 영역 변경
                    updateLoginArea(
                        result.username
                    );


                    // 로그인 후 일정 다시 불러오기
                    await loadSchedules();


                } else {

                    alert(
                        result.message ||
                        "로그인에 실패했습니다."
                    );
                }


            } catch (error) {

                console.error(
                    "로그인 오류:",
                    error
                );


                alert(
                    "서버에 연결할 수 없습니다."
                );
            }
        }
    );
}


// ======================================================
// 로그인 영역 변경
// ======================================================

// ======================================================
// 로그인 영역 변경
// ======================================================

function updateLoginArea(username) {

    const loginArea =
        document.getElementById(
            "login-area"
        );

    if (!loginArea) {
        return;
    }

    loginArea.replaceChildren();

    // 사용자 아이콘
    const icon =
        document.createElement(
            "span"
        );

    icon.className =
        "material-symbols-outlined login-icon";

    icon.textContent =
        "account_circle";

    // 사용자 이름
    const userText =
        document.createElement(
            "span"
        );

    userText.className =
        "login-user";

    userText.textContent =
        `${username}님`;

    // 로그아웃 버튼
    const logoutButton =
        document.createElement(
            "button"
        );

    logoutButton.type =
        "button";

    logoutButton.className =
        "logout-button";

    logoutButton.id =
        "logout-button";

    logoutButton.title =
        "로그아웃";

    logoutButton.innerHTML = `
        <span class="material-symbols-outlined">
            logout
        </span>
    `;

    // 화면에 추가
    loginArea.appendChild(
        icon
    );

    loginArea.appendChild(
        userText
    );

    loginArea.appendChild(
        logoutButton
    );
}


// ======================================================
// 페이지 처음 열었을 때 로그인 상태 복원
// ======================================================

function restoreLoginState() {

    const userId =
        getUserId();


    const username =
        getUsername();


    if (
        !userId ||
        !username
    ) {

        return;
    }


    updateLoginArea(
        username
    );
}

// ======================================================
// 로그아웃 버튼 이벤트
// ======================================================

document.addEventListener(
    "click",
    event => {

        const logoutButton =
            event.target.closest(
                "#logout-button"
            );

        if (!logoutButton) {
            return;
        }

        logout();
    }
);

// ======================================================
// 마감시간 실시간 갱신
// ======================================================

setInterval(
    () => {

        if (
            schedules.length > 0
        ) {

            renderSchedules();

            renderScheduleFinder();
        }

    },
    60000
);


// ======================================================
// 초기 실행
// ======================================================

function initializePage() {

    const userId = getUserId();
    const username = getUsername();

    // 로그인되어 있는 경우
    if (userId && username) {

        updateLoginArea(username);

        loadSchedules();

        return;
    }

    // 로그인되어 있지 않은 경우
    schedules = [];

    renderCalendar();
    renderSchedules();
    renderScheduleFinder();
}

initializePage();