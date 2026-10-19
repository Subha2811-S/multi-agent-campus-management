
import json
import sys

from rl_engine import train_q_learning


def main():
    payload = json.load(sys.stdin)

    entries = payload.get("entries", [])
    classrooms = payload.get("classrooms", [])
    student_count = int(payload.get("studentCount", 50))

    result = train_q_learning(
        entries=entries,
        classrooms=classrooms,
        student_count=student_count,
    )

    print(json.dumps(result, default=str))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({
            "success": False,
            "message": str(exc),
        }))
        sys.exit(1)
