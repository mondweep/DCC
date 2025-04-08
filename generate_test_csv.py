import re
import csv

def extract_test_cases(md_file):
    test_cases = []
    with open(md_file, 'r') as f:
        content = f.read()

    # Regex to find test case title, steps, and expected results
    test_case_regex = re.compile(
        r"### Test Case (.*?)\n"  # Test Case Title
        r"(\*\*Steps:\*\*\n(.*?))?"  # Steps (optional)
        r"\*\*Expected Result:\*\*\n(.*?)(?=\n###|\Z)",  # Expected Result (until next test case or end of file)
        re.DOTALL
    )

    matches = test_case_regex.findall(content)

    for match in matches:
        title = match[0].strip()
        steps = match[2].strip().replace('\n', '; ').replace('*', '').strip() if match[1] else ""
        expected_result = match[3].strip().replace('\n', '; ').replace('*', '').strip()

        test_cases.append([title, steps, expected_result])

    return test_cases

def write_to_csv(test_cases, csv_file):
    with open(csv_file, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(['Test Case Title', 'Steps', 'Expected Result'])  # Header
        csvwriter.writerows(test_cases)

if __name__ == "__main__":
    test_cases = extract_test_cases('frontend-manual-test-plan.md')
    write_to_csv(test_cases, 'frontend-manual-test-plan.csv')