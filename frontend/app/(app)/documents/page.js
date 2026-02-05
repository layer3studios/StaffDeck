'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { documentAPI } from '@/lib/api'
import { FolderOpen, FileText, Download, Trash2, Upload, Search, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export default function DocumentsPage() {
    const [search, setSearch] = useState('')
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const fetchDocs = useCallback(async () => {
        try {
            const response = await documentAPI.getAll({ search })
            if (response.data && response.data.data) {
                setDocs(response.data.data)
            } else {
                setDocs([])
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error)
            setDocs([])
        } finally {
            setLoading(false)
        }
    }, [search])

    useEffect(() => {
        setLoading(true)
        const timer = setTimeout(() => {
            fetchDocs()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchDocs])

    const handleDelete = async (id) => {
        try {
            await documentAPI.delete(id)
            setDocs(docs.filter(d => (d.id !== id && d._id !== id)))
            toast.success('Document deleted')
        } catch (error) {
            toast.error('Failed to delete document')
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', file.name)
        formData.append('type', 'Other') // Default type, could be enhanced with a selector

        setUploading(true)
        try {
            const response = await documentAPI.upload(formData)
            if (response.data.success) {
                toast.success('Document uploaded successfully')
                // Refresh list or append new doc
                setDocs([response.data.data, ...docs])
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to upload document')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const typeColors = {
        'Policy': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
        'Template': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        'Legal': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    }

    return (
        <div>
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Company policies, templates, and legal documents
                    </p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
            </div>

            <Card className="mb-4">
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search documents…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </Card>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                    </div>
                ) : docs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-sm font-medium">No documents found</p>
                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {docs.map((doc) => (
                            <motion.div
                                key={doc.id || doc._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                                <FileText className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium mb-1">{doc.name}</div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Uploaded {doc.uploadedAt ? formatDate(doc.uploadedAt) : 'Recently'}</span>
                                                    <span>•</span>
                                                    <span>{doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : '1.2 MB'}</span>
                                                </div>
                                            </div>
                                            <Badge className={typeColors[doc.type] || 'bg-gray-100 text-gray-700'}>{doc.type || 'File'}</Badge>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const url = doc.url.startsWith('http')
                                                            ? doc.url
                                                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${doc.url}`
                                                        window.open(url, '_blank')
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(doc.id || doc._id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
