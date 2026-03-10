export function generateApplicationNumber(courseName: string): string {
    // Generate a unique application number based on the course prefix and a timestamp/random component
    // E.g. 'BBA' -> 'BBA-26-XXXXX'

    // Extract first letters of course name words, up to 3 chars
    const prefix = courseName
        .split(/[\s-]+/)
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase() || 'APP'

    const year = new Date().getFullYear().toString().slice(-2)

    // Generate a random 5 digit string
    const random = Math.floor(10000 + Math.random() * 90000).toString()

    return `${prefix}-${year}-${random}`
}
