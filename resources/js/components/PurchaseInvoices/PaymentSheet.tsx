"use client"

import { useState } from "react"
import { router } from "@inertiajs/react"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Plus } from "lucide-react"

interface PaymentMethod {
    uuid: string
    name: string
}

interface Payment {
    uuid: string
    amount: string
    payment_date: string
    notes?: string
    payment_method: {
        name: string
    }
}

interface PaymentSheetProps {
    invoiceUuid: string
    remainingAmount: number
    paymentMethods: PaymentMethod[]
    payments: Payment[]
    isPaid: boolean
}

export default function PaymentSheet({
    invoiceUuid,
    remainingAmount,
    paymentMethods,
    payments,
    isPaid,
}: PaymentSheetProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState(remainingAmount)
    const [methodUuid, setMethodUuid] = useState(paymentMethods[0]?.uuid || "")
    const [notes, setNotes] = useState("")
    const [processing, setProcessing] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        setProcessing(true)

        router.post(`/purchase_invoices/${invoiceUuid}/payments`, {
            amount,
            payment_method_uuid: methodUuid,
            notes,
        }, {
            onSuccess: () => {
                setProcessing(false)
                setOpen(false) // 🔥 CLOSE SHEET
                setNotes("")
                setAmount(remainingAmount)
            },
            onError: () => {
                setProcessing(false)
            }
        })
    }

    return (
        <div className="bg-white border rounded-xl p-6 shadow-sm mt-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Payments</h2>

                {/* Sheet Trigger */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button disabled={isPaid}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Payment
                        </Button>
                    </SheetTrigger>

                    <SheetContent className="w-105 sm:w-125">

                        <SheetHeader>
                            <SheetTitle>Add Payment</SheetTitle>
                        </SheetHeader>

                        {/* Payment Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 mt-6 px-6"
                        >

                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={remainingAmount}
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Method</Label>

                                <Select
                                    value={methodUuid}
                                    onValueChange={setMethodUuid}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem
                                                key={method.uuid}
                                                value={method.uuid}
                                            >
                                                {method.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing ? "Saving..." : "Create Payment"}
                            </Button>
                        </form>

                    </SheetContent>
                </Sheet>
            </div>



            {/* Payments Table */}
            {payments.length === 0 ? (
                <p className="text-sm text-slate-500">
                    No payments recorded yet.
                </p>
            ) : (
                <table className="w-full text-sm">

                    <thead>
                        <tr className="text-left border-b">
                            <th className="py-3">Date</th>
                            <th>Method</th>
                            <th>Notes</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>

                    <tbody>

                        {payments.map((payment) => (
                            <tr key={payment.uuid} className="border-b">

                                <td className="py-3">
                                    {payment.payment_date}
                                </td>

                                <td>
                                    {(payment as any).payment_method?.name ?? (payment as any).paymentMethod?.name}
                                </td>

                                <td>
                                    {payment.notes || "-"}
                                </td>

                                <td className="text-right font-semibold">
                                    ${Number(payment.amount)}
                                </td>

                            </tr>
                        ))}

                    </tbody>
                </table>
            )}

        </div>
    )
}