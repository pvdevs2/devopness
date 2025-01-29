/**
 * PR Description Validator
 *
 * This script is used by the GitHub Actions workflow `.github/workflows/lint-pr.yml` to validate
 * Pull Request descriptions. It ensures that PRs follow the required template format and contain
 * all necessary information.
 *
 * Workflow Integration:
 * 1. Called by the 'PR - Lint' workflow on pull_request_target events
 * 2. Receives PR description data from the kkurno/action-markdown-reader action
 * 3. Validates three main sections:
 *    - Description of changes
 *    - GitHub issues resolved
 *    - Quality Assurance checklist
 *
 * Usage in workflow:
 * ```yaml
 * - name: Validate PR Description Fields
 *   run: |-
 *     PR_DESCRIPTION_JSON=$(cat .github/scripts/tmp-pr-description-data.json | base64) node .github/scripts/pr-validate-description.js
 * ```
 *
 * Local testing:
 * PR_DESCRIPTION_JSON=$(cat ./pr-validate-description-test-data.json | base64) node pr-validate-description.js
 */

/**
 * @typedef {Object} MarkdownItem
 * @property {string} type - Type of markdown content (e.g., 'list', 'text')
 * @property {string} raw - Original unprocessed markdown content
 * @property {Array<{checked: boolean, raw: string}>} [items] - For type='list', array of items with checkbox state
 */

/**
 * @typedef {Object} PRTemplateSection
 * @property {Array<MarkdownItem>} bodies - Array of processed markdown content sections
 * @see {@link https://github.com/kkurno/action-markdown-reader#example-usage markdown-reader action output format}
 */

let inputData = Buffer.from(process.env.PR_DESCRIPTION_JSON, "base64").toString(
  "utf8",
);
let prDescription = JSON.parse(inputData);

validateDescriptionOfChanges(prDescription.Description_of_changes);
validateResolvedIssuesSection(prDescription.GitHub_issues_resolved_by_this_PR);
validateQaSection(prDescription.Quality_Assurance);

/**
 * Logs a validation failure message and sets exit code to 1
 * @param {string} fieldName - Name of the field that failed validation
 * @param {string} message - Error message to display
 */
function fail(fieldName, message) {
  console.log(`❌ ${fieldName}:
  > ${message}`);
  process.exitCode = 1;
}

/**
 * Logs a validation success message
 * @param {string} fieldName - Name of the field that passed validation
 * @param {string} message - Success message to display
 */
function pass(fieldName, message) {
  console.log(`✅ ${fieldName}:
  > ${message}`);
}

/**
 * Validates the "Description of Changes" section of the PR template
 * @param {PRTemplateSection} descriptionOfChanges - Processed markdown content from "Description of changes" section, generated by kkurno/action-markdown-reader action
 */
function validateDescriptionOfChanges(descriptionOfChanges) {
  if (!descriptionOfChanges?.bodies) {
    fail(
      "Description of Changes",
      "Invalid PR template format. The 'Description of changes' section is missing or malformed.",
    );
    return;
  }

  // Find all list items
  const changes = descriptionOfChanges.bodies
    .filter((item) => item.type === "list")
    .flatMap((item) => item.items || [])
    .filter((item) => {
      if (!item.raw) return false;

      // Check if the text contains anything between angle brackets
      const placeholderRegex = /<[^>]+>/;
      const isPlaceholder = placeholderRegex.test(item.raw.trim());

      // Return true only for non-empty, non-placeholder items
      return item.raw.trim().length > 0 && !isPlaceholder;
    });

  if (!changes.length) {
    fail(
      "Description of Changes",
      "Pull requests must include at least one specific change in the 'Description of changes' field. Template placeholders are not valid descriptions.",
    );
    return;
  }

  // Additional check for meaningful content (optional)
  const meaningfulChanges = changes.filter(
    (item) => item.raw.trim().length > 10, // Ensure description has some substance
  );

  if (!meaningfulChanges.length) {
    fail(
      "Description of Changes",
      "Description items must contain meaningful content (more than just a few characters).",
    );
    return;
  }

  pass(
    "Description of Changes",
    meaningfulChanges.map((item) => item.raw).join("\n    > "),
  );
}
// function validateDescriptionOfChanges(descriptionOfChanges) {
//   if (!descriptionOfChanges?.bodies) {
//     fail("Description of Changes", "The section is missing or malformed.");
//     return;
//   }

//   // Find all list items
//   const changes = descriptionOfChanges.bodies
//     .filter((item) => item.type === "list")
//     .flatMap((item) => item.items || [])
//     .filter((item) => {
//       if (!item.raw) return false;

//       // Check if the text contains anything between angle brackets
//       const placeholderRegex = /<[^>]+>/;
//       const isPlaceholder = placeholderRegex.test(item.raw.trim());

//       // Return true only for non-empty, non-placeholder items
//       return item.raw.trim().length > 0 && !isPlaceholder;
//     });

//   if (!changes.length) {
//     fail(
//       "Description of Changes",
//       "Pull requests must include at least one specific change in the 'Description of changes' field. Template placeholders are not valid descriptions.",
//     );
//     return;
//   }
//   // const descriptionText = descriptionOfChanges.bodies
//   //   .filter((item) => item.type === "list" || item.type === "text")
//   //   .map((item) => item.raw.trim())
//   //   .join(" ");

//   // if (
//   //   !descriptionText ||
//   //   descriptionText.includes(
//   //     "<add one check list item here for each meaningful change on this PR>",
//   //   )
//   // ) {
//   //   fail(
//   //     "Description of Changes",
//   //     "The section must contain meaningful content, not a placeholder.",
//   //   );
//   //   return;
//   // }
//   // pass("Description of Changes", descriptionText);
// }

/**
 * Validates GitHub issues section, checking for issue references (#123) or marked as N/A
 * @param {PRTemplateSection} resolvedIssues - Processed markdown content from "GitHub issues resolved by this PR" section, generated by kkurno/action-markdown-reader action
 */
function validateResolvedIssuesSection(resolvedIssues) {
  if (!resolvedIssues?.bodies) {
    fail(
      "GitHub Issues",
      "Invalid PR template format. The 'GitHub issues resolved by this PR' section is missing or malformed.",
    );
    return;
  }

  const issuesCheckList = resolvedIssues.bodies
    .filter((item) => item.type === "list")
    .at(0);

  if (!issuesCheckList?.raw) {
    fail(
      "GitHub Issues",
      "The 'GitHub issues resolved by this PR' section must contain a list of resolved issues.",
    );
    return;
  }

  const GITHUB_ISSUE_FORMAT = /#\d+/g;
  const issueList = issuesCheckList.raw.match(GITHUB_ISSUE_FORMAT) ?? [];

  if (
    issueList.length === 0 &&
    !issuesCheckList.raw.toLowerCase().includes("n/a")
  ) {
    fail(
      "Missing Resolved Issues",
      `Pull requests must specify at least one resolved GitHub issue (e.g., #123) or explicitly state "N/A" if no issue applies, in field "${issuesCheckList.raw}"`,
    );
    return;
  }
  pass(
    "Issues resolved by this pull request",
    issueList.length > 0 ? issueList : "N/A",
  );
}

/**
 * Validates if QA section has success criteria properly defined
 * @param {PRTemplateSection} qaSection - Processed markdown content from "Quality Assurance" section, generated by kkurno/action-markdown-reader action
 */
function validateQaSection(qaSection) {
  if (!qaSection?.bodies) {
    fail(
      "Quality Assurance",
      "Invalid PR template format. The 'Quality Assurance' section is missing or malformed.",
    );
    return;
  }

  const SUCCESS_CRITERIA_TITLE =
    "- Once the changes in this PR are merged and deployed, success criteria is:";

  const qaCheckList = qaSection.bodies
    .filter((item) => item.type === "list")
    .at(0);

  if (!qaCheckList) {
    fail(
      "Quality Assurance",
      "The 'Quality Assurance' section must contain a list with success criteria.",
    );
    return;
  }

  if (!qaCheckList.items?.length) {
    fail(
      "Quality Assurance",
      "The success criteria list in the 'Quality Assurance' section cannot be empty.",
    );
    return;
  }

  const successCriteria = qaCheckList.items[0];

  if (!successCriteria?.raw) {
    fail(
      "Quality Assurance",
      "Invalid success criteria format in the 'Quality Assurance' section.",
    );
  }

  if (successCriteria.raw.trim() === SUCCESS_CRITERIA_TITLE) {
    fail(
      "Success criteria",
      `Pull requests must have a short description of success criteria, in field "${successCriteria.raw}"`,
    );
  }
  pass("Success criteria", successCriteria.raw);
}
