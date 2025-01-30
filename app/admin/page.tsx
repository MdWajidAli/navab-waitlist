"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion } from "framer-motion"

interface Email {
  _id: string
  email: string
  submissionDate: string
}

export default function AdminDashboard() {
  const [emails, setEmails] = useState<Email[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/admin/emails")
      if (response.ok) {
        const data = await response.json()
        setEmails(data)
      } else {
        console.error("Failed to fetch emails")
      }
    } catch (error) {
      console.error("Error fetching emails:", error)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredEmails = emails.filter((email) => email.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Email,Submission Date\n" +
      filteredEmails.map((e) => `${e.email},${e.submissionDate}`).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "waitlist_emails.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <div className="mb-6 flex justify-between items-center">
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-xs bg-white bg-opacity-20 border-0 text-white placeholder-gray-300"
          />
          <Button onClick={handleExport} className="bg-white text-gray-900 hover:bg-gray-200">
            Export to CSV
          </Button>
        </div>
        <div className="bg-white bg-opacity-10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-gray-300">Email</TableHead>
                <TableHead className="font-semibold text-gray-300">Submission Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.map((email, index) => (
                <motion.tr
                  key={email._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <TableCell className="font-medium text-white">{email.email}</TableCell>
                  <TableCell className="text-gray-300">{new Date(email.submissionDate).toLocaleString()}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  )
}

