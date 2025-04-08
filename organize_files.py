import os
import shutil

def organize_files():
    # Create directories
    os.makedirs("front_end_testing", exist_ok=True)
    os.makedirs("backend_testing", exist_ok=True)

    # Move files
    shutil.move("frontend-manual-test-plan.md", "front_end_testing/frontend-manual-test-plan.md")
    shutil.move("frontend-manual-test-plan.csv", "front_end_testing/frontend-manual-test-plan.csv")
    shutil.move("coverage_report.md", "backend_testing/coverage_report.md")

if __name__ == "__main__":
    organize_files()