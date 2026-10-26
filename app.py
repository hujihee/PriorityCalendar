from flask import Flask, request, jsonify, send_from_directory
import psycopg2
import os

app = Flask(__name__)


# ======================================================
# SQL Server 연결
# ======================================================

def get_db_connection():
    return psycopg2.connect(
        os.environ.get("DATABASE_URL")
    )


# ======================================================
# 메인 페이지
# ======================================================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


# ======================================================
# CSS
# ======================================================

@app.route("/style.css")
def style():
    return send_from_directory(".", "style.css")


# ======================================================
# JavaScript
# ======================================================

@app.route("/script.js")
def script():
    return send_from_directory(".", "script.js")


# ======================================================
# 회원가입
# ======================================================

@app.route("/signup", methods=["POST"])
def signup():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "입력된 데이터가 없습니다."
            }), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "아이디와 비밀번호를 입력해주세요."
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # 같은 아이디가 있는지 확인
        cursor.execute(
            """
            SELECT user_id
            FROM "Users"
            WHERE username = %s
            """,
            (username,)
        )

        if cursor.fetchone():
            conn.close()

            return jsonify({
                "success": False,
                "message": "이미 사용 중인 아이디입니다."
            }), 409

        # 회원가입
        cursor.execute(
            """
            INSERT INTO "Users"
            (
                username,
                password
            )
            VALUES (%s, %s)
            """,
            (
                username,
                password
            )
        )

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "회원가입이 완료되었습니다."
        })

    except Exception as e:

        print("회원가입 오류:", e)

        return jsonify({
            "success": False,
            "message": "회원가입 중 오류가 발생했습니다.",
            "error": str(e)
        }), 500


# ======================================================
# 로그인
# ======================================================

@app.route("/login", methods=["POST"])
def login():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "입력된 데이터가 없습니다."
            }), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "아이디와 비밀번호를 입력해주세요."
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                user_id,
                username
            FROM "Users"
            WHERE username = %s
            AND password = %s
            """,
            (
                username,
                password
            )
        )

        user = cursor.fetchone()

        conn.close()

        if user:

            print(
                "로그인 성공:",
                "user_id =", user[0],
                "username =", user[1]
            )

            return jsonify({
                "success": True,
                "message": "로그인되었습니다.",
                "user_id": int(user[0]),
                "username": str(user[1])
            })

        return jsonify({
            "success": False,
            "message": "아이디 또는 비밀번호가 올바르지 않습니다."
        }), 401

    except Exception as e:

        print("로그인 오류:", e)

        return jsonify({
            "success": False,
            "message": "로그인 중 오류가 발생했습니다.",
            "error": str(e)
        }), 500


# ======================================================
# 일정 불러오기
# ======================================================

@app.route("/schedules", methods=["GET"])
def get_schedules():

    try:

        user_id = request.args.get("user_id")

        if not user_id:
            return jsonify({
                "success": False,
                "message": "로그인이 필요합니다."
            }), 401

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):

            return jsonify({
                "success": False,
                "message": "잘못된 사용자 정보입니다."
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                schedule_id,
                title,
                start_date,
                deadline_date,
                deadline_ampm,
                deadline_hour,
                deadline_minute,
                priority,
                color,
                memo,
                completed
            FROM "Schedules"
            WHERE user_id = %s
            ORDER BY start_date ASC, schedule_id ASC
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        schedules = []

        for row in rows:

            # ------------------------------------------
            # 시작 날짜
            # ------------------------------------------

            if row[2] is not None:
                start_date = row[2].strftime("%Y-%m-%d")
            else:
                start_date = ""

            # ------------------------------------------
            # 마감 날짜 + 시간
            # ------------------------------------------

            deadline = ""

            if row[3] is not None:

                if hasattr(row[3], "strftime"):
                    deadline_date = row[3].strftime("%Y-%m-%d")
                else:
                    deadline_date = str(row[3])[:10]

                hour = (
                    int(row[5])
                    if row[5] is not None
                    else 12
                )

                minute = (
                    int(row[6])
                    if row[6] is not None
                    else 0
                )

                ampm = row[4] or "AM"

                # 12시간제 → 24시간제
                if ampm == "PM" and hour != 12:
                    hour += 12

                if ampm == "AM" and hour == 12:
                    hour = 0

                hour = max(0, min(hour, 23))
                minute = max(0, min(minute, 59))

                deadline = (
                    f"{deadline_date}T"
                    f"{str(hour).zfill(2)}:"
                    f"{str(minute).zfill(2)}"
                )

            # ------------------------------------------
            # 일정 데이터
            # ------------------------------------------

            schedules.append({

                "schedule_id":
                    int(row[0]),

                "title":
                    str(row[1]),

                "date":
                    start_date,

                "deadline":
                    deadline,

                "priority":
                    row[7] or "normal",

                "color":
                    row[8] or "#C9A98A",

                "memo":
                    row[9] or "",

                "completed":
                    bool(row[10])
            })

        conn.close()

        return jsonify({
            "success": True,
            "schedules": schedules
        })

    except Exception as e:

        print("일정 불러오기 오류:", e)

        return jsonify({
            "success": False,
            "message": "일정 데이터를 불러오는 중 오류가 발생했습니다.",
            "error": str(e)
        }), 500


# ======================================================
# 일정 추가
# ======================================================

# ==============================
# 일정 추가
# ==============================

@app.route("/schedules", methods=["POST"])
def add_schedule():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "입력된 일정 데이터가 없습니다."
            }), 400

        # ==============================
        # 사용자 정보
        # ==============================

        user_id = data.get("user_id")

        if user_id is None:
            return jsonify({
                "success": False,
                "message": "사용자 정보가 없습니다."
            }), 400

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):

            return jsonify({
                "success": False,
                "message": "잘못된 사용자 정보입니다."
            }), 400


        # ==============================
        # 일정 정보
        # ==============================

        title = data.get("title")
        date = data.get("date")

        deadline_date = data.get("deadline_date")
        deadline_ampm = data.get("deadline_ampm")
        deadline_hour = data.get("deadline_hour")
        deadline_minute = data.get("deadline_minute")

        priority = data.get("priority")
        color = data.get("color")
        memo = data.get("memo")


        # ==============================
        # 제목 확인
        # ==============================

        if not title:

            return jsonify({
                "success": False,
                "message": "일정 제목을 입력해주세요."
            }), 400


        # ==============================
        # 날짜 확인
        # ==============================

        if not date:

            return jsonify({
                "success": False,
                "message": "일정 날짜를 선택해주세요."
            }), 400


        # ==============================
        # 마감시간 기본값 처리
        # ==============================

        if deadline_date:

            if deadline_ampm not in ["AM", "PM"]:
                deadline_ampm = "AM"

            if deadline_hour in [None, ""]:
                deadline_hour = 12
            else:
                deadline_hour = int(deadline_hour)

            if deadline_minute in [None, ""]:
                deadline_minute = 0
            else:
                deadline_minute = int(deadline_minute)

        else:

            deadline_date = None
            deadline_ampm = None
            deadline_hour = None
            deadline_minute = None


        # ==============================
        # 기본값
        # ==============================

        if not priority:
            priority = "normal"

        if not color:
            color = "#C9A98A"

        if memo is None:
            memo = ""


        # ==============================
        # DB 연결
        # ==============================

        conn = get_db_connection()
        cursor = conn.cursor()


        # ==============================
        # 사용자 존재 여부 확인
        # ==============================

        cursor.execute(
            """
            SELECT user_id
            FROM "Users"
            WHERE user_id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:

            conn.close()

            return jsonify({
                "success": False,
                "message": "존재하지 않는 사용자입니다."
            }), 400


        # ==============================
        # 일정 저장
        # ==============================

        cursor.execute(
            """
            INSERT INTO "Schedules"
            (
                user_id,
                title,
                start_date,
                deadline_date,
                deadline_ampm,
                deadline_hour,
                deadline_minute,
                priority,
                color,
                memo,
                completed
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                FALSE
            )
            """,
            (
                user_id,
                title,
                date,
                deadline_date,
                deadline_ampm,
                deadline_hour,
                deadline_minute,
                priority,
                color,
                memo
            )
        )


        conn.commit()


        # ==============================
        # 방금 저장한 일정 ID
        # ==============================

        # ==============================
        # 방금 저장한 일정 ID 가져오기
        # ==============================

        cursor.execute(
            """
            SELECT schedule_id
            FROM "Schedules"
            WHERE user_id = %s
            ORDER BY schedule_id DESC
            LIMIT 1
            """,
            (user_id,)
        )

        result = cursor.fetchone()

        if result is None:

            conn.close()

            return jsonify({
                "success": False,
                "message": "일정 ID를 가져오지 못했습니다."
            }), 500

        schedule_id = result[0]

        conn.close()


        print(
            "일정 저장 성공:",
            "user_id =", user_id,
            "schedule_id =", schedule_id,
            "title =", title
        )


        return jsonify({
            "success": True,
            "schedule_id": int(schedule_id),
            "message": "일정이 저장되었습니다."
        })


    except Exception as e:

        print(
            "일정 저장 오류:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message": "일정 저장 중 오류가 발생했습니다.",
            "error": str(e)
        }), 500


# ======================================================
# 일정 완료 상태 변경
# ======================================================

@app.route(
    "/schedules/<int:schedule_id>/complete",
    methods=["PUT"]
)
def complete_schedule(schedule_id):

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "입력된 데이터가 없습니다."
            }), 400

        user_id = data.get("user_id")
        completed = data.get("completed")

        if not user_id:

            return jsonify({
                "success": False,
                "message": "로그인이 필요합니다."
            }), 401

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):

            return jsonify({
                "success": False,
                "message": "잘못된 사용자 정보입니다."
            }), 400

        completed_value = True if completed else False

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE "Schedules"
            SET completed = %s
            WHERE schedule_id = %s
            AND user_id = %s
            """,
            (
                completed_value,
                schedule_id,
                user_id
            )
        )

        affected_rows = cursor.rowcount

        conn.commit()
        conn.close()

        if affected_rows == 0:

            return jsonify({
                "success": False,
                "message": "해당 일정을 찾을 수 없습니다."
            }), 404

        return jsonify({
            "success": True,
            "message": "완료 상태가 변경되었습니다."
        })

    except Exception as e:

        print("일정 완료 처리 오류:", e)

        return jsonify({
            "success": False,
            "message": "일정 완료 처리 중 오류가 발생했습니다.",
            "error": str(e)
        }), 500


# ======================================================
# 일정 삭제
# ======================================================

@app.route(
    "/schedules/<int:schedule_id>",
    methods=["DELETE"]
)
def delete_schedule(schedule_id):

    try:

        user_id = request.args.get("user_id")

        if not user_id:

            return jsonify({
                "success": False,
                "message": "로그인이 필요합니다."
            }), 401

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):

            return jsonify({
                "success": False,
                "message": "잘못된 사용자 정보입니다."
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM "Schedules"
            WHERE schedule_id = %s
            AND user_id = %s
            """,
            (
                schedule_id,
                user_id
            )
        )

        affected_rows = cursor.rowcount

        conn.commit()
        conn.close()

        if affected_rows == 0:

            return jsonify({
                "success": False,
                "message": "해당 일정을 찾을 수 없습니다."
            }), 404

        return jsonify({
            "success": True,
            "message": "일정이 삭제되었습니다."
        })

    except Exception as e:

        print("일정 삭제 오류:", e)

        return jsonify({
            "success": False,
            "message": "일정 삭제 중 오류가 발생했습니다.",
            "error": str(e)
        }), 500


# ======================================================
# 서버 실행
# ======================================================

if __name__ == "__main__":
    app.run(debug=True)