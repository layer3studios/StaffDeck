export function formatCurrency(amount, isPrivacyMode = false) {
    if (isPrivacyMode) {
        return null // Will be handled by component
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount)
}

export function formatDate(dateString) {
    if (!dateString) return 'Invalid date'

    try {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date)
    } catch (e) {
        return 'Invalid date'
    }
}

export function formatRelativeDate(dateString) {
    if (!dateString) return ''

    try {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
        return `${Math.floor(diffDays / 365)} years ago`
    } catch (e) {
        return ''
    }
}

export function getInitials(name) {
    if (!name) return '??'

    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}
