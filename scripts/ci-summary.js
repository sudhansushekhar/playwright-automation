// Writes a short Markdown summary of reporting-labs/report.json to the GitHub Actions job summary.
// Usage (CI): node scripts/ci-summary.js >> "$GITHUB_STEP_SUMMARY"
const fs = require('fs')

const reportPath = 'reporting-labs/report.json'
if (!fs.existsSync(reportPath)) {
    console.log('### Playwright results\n\nNo reporting-labs report was generated (the run may have failed before tests started).')
    process.exit(0)
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
const s = report.stats
const icon = report.runStatus === 'passed' ? '✅' : '❌'
const minutes = (report.duration / 60000).toFixed(1)

const lines = [
    `### ${icon} ${report.title}`,
    '',
    `| Total | Passed | Failed | Flaky | Skipped | Duration |`,
    `|------:|-------:|-------:|------:|--------:|---------:|`,
    `| ${s.total} | ${s.passed} | ${s.failed + s.timedOut + s.interrupted} | ${s.flaky} | ${s.skipped} | ${minutes} min |`,
]

const failed = report.tests.filter(t => ['failed', 'timedOut', 'interrupted'].includes(t.outcome))
if (failed.length) {
    lines.push('', '**Failed tests**', '')
    for (const t of failed) {
        lines.push(`- \`${t.project}\` ${[...t.path, t.title].join(' › ')} (${t.file}:${t.line})`)
    }
}

lines.push('', 'Download the **reporting-labs-report** artifact below and open `index.html` for the full report.')
console.log(lines.join('\n'))
