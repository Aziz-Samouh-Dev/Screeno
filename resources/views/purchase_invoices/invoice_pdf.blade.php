<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
@page { size: A4 portrait; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #1a1a1a; background: #fff; line-height: 1.4; padding: 14mm; }

.top { width: 100%; border-bottom: 3px solid #1e293b; padding-bottom: 14px; margin-bottom: 14px; }
.top td { vertical-align: top; }
.co-name  { font-size: 18px; font-weight: 900; color: #1e293b; }
.co-meta  { font-size: 8px; color: #64748b; line-height: 1.8; margin-top: 5px; }
.doc-label { font-size: 26px; font-weight: 900; color: #1e293b; text-align: right; letter-spacing: -1px; }
.doc-num   { font-size: 12px; font-weight: 700; color: #6d28d9; text-align: right; font-family: "Courier New", monospace; margin-top: 3px; }
.doc-meta  { text-align: right; margin-top: 8px; }
.doc-meta table { margin-left: auto; border-collapse: collapse; }
.doc-meta td { padding: 1px 0; font-size: 8px; }
.doc-meta .ml { color: #64748b; padding-right: 10px; }
.doc-meta .mr { font-weight: 700; color: #1e293b; text-align: right; }

.stamp { display: inline-block; border: 2px solid; padding: 2px 10px; font-size: 9px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-top: 6px; }
.stamp-paid    { border-color: #16a34a; color: #16a34a; }
.stamp-partial { border-color: #d97706; color: #d97706; }
.stamp-unpaid  { border-color: #dc2626; color: #dc2626; }

.bts { width: 100%; margin-bottom: 14px; }
.bts td { vertical-align: top; }
.section-lbl { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
.party-name   { font-size: 13px; font-weight: 900; color: #1e293b; margin-top: 4px; margin-bottom: 3px; }
.party-detail { font-size: 8px; color: #475569; line-height: 1.8; }

.sum-tbl { width: 100%; border-collapse: collapse; margin-top: 4px; }
.sum-tbl td { padding: 3px 0; font-size: 8.5px; }
.sum-l { color: #64748b; }
.sum-r { text-align: right; font-weight: 700; font-family: "Courier New", monospace; }
.sum-r.green { color: #16a34a; }
.sum-r.red   { color: #dc2626; }
.sum-divider td { border-top: 1px solid #e2e8f0; padding-top: 5px; }
.sum-big { font-size: 11px; font-weight: 900; }

.it { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
.it thead tr { background: #1e293b; }
.it thead th { padding: 8px 10px; text-align: left; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-right: 1px solid #334155; }
.it thead th:last-child { border-right: none; }
.it thead th.r { text-align: right; }
.it thead th.c { text-align: center; }
.it tbody tr { background: #fff; }
.it tbody tr.alt { background: #f8fafc; }
.it tbody td { padding: 8px 10px; font-size: 9px; color: #1e293b; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
.it tbody td:last-child { border-right: none; }
.it tbody td.r { text-align: right; font-family: "Courier New", monospace; }
.it tbody td.c { text-align: center; }
.it tbody td.num { color: #94a3b8; font-size: 8px; }
.it tfoot tr { background: #f1f5f9; }
.it tfoot td { padding: 7px 10px; font-size: 8.5px; color: #64748b; border-top: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; }
.it tfoot td:last-child { border-right: none; }
.it tfoot td.r { text-align: right; font-family: "Courier New", monospace; font-weight: 700; color: #1e293b; }

.tot-outer { width: 100%; }
.tot-outer td { vertical-align: top; }
.tot-box { width: 240px; border: 1px solid #cbd5e1; border-collapse: collapse; }
.tot-box td { padding: 0; }
.tot-row { width: 100%; border-collapse: collapse; border-bottom: 1px solid #e2e8f0; }
.tot-row td { padding: 6px 12px; font-size: 8.5px; }
.tot-l { color: #64748b; }
.tot-r { text-align: right; font-weight: 700; font-family: "Courier New", monospace; }
.tot-r.green { color: #16a34a; }
.tot-r.amber { color: #d97706; }
.tot-final { width: 100%; border-collapse: collapse; background: #1e293b; }
.tot-final td { padding: 9px 12px; }
.tot-fl { color: #94a3b8; font-size: 8px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
.tot-fr { text-align: right; color: #fff; font-size: 13px; font-weight: 900; font-family: "Courier New", monospace; }

.pay-title { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-top: 16px; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
.pay { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
.pay thead tr { background: #f0fdf4; }
.pay thead th { padding: 6px 10px; text-align: left; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #15803d; border-bottom: 1px solid #bbf7d0; border-right: 1px solid #d1fae5; }
.pay thead th:last-child { border-right: none; }
.pay thead th.r { text-align: right; }
.pay tbody td { padding: 6px 10px; font-size: 8.5px; color: #334155; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
.pay tbody td:last-child { border-right: none; }
.pay tbody td.r { text-align: right; font-family: "Courier New", monospace; font-weight: 700; color: #16a34a; }
.pay tfoot td { padding: 6px 10px; font-size: 8.5px; font-weight: 700; border-top: 2px solid #bbf7d0; background: #f0fdf4; }
.pay tfoot td.r { text-align: right; font-family: "Courier New", monospace; color: #15803d; }

.notes-box { margin-top: 14px; padding: 8px 12px; background: #f8fafc; border-left: 3px solid #cbd5e1; font-size: 8px; color: #475569; font-style: italic; }
.footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; width: 100%; }
.footer td { font-size: 7.5px; color: #94a3b8; }
.bold { font-weight: 700; }
.mono { font-family: "Courier New", monospace; }
</style>
</head>
<body>

{{-- HEADER --}}
<table class="top"><tr>
    <td style="width:55%">
        @if(!empty($company['name']))
            <div class="co-name">{{ $company['name'] }}</div>
        @endif
        <div class="co-meta">
            @if(!empty($company['address'])){{ $company['address'] }}<br>@endif
            @if(!empty($company['city'])){{ $company['city'] }}<br>@endif
            @if(!empty($company['phone']))Tel : {{ $company['phone'] }}<br>@endif
            @if(!empty($company['email'])){{ $company['email'] }}<br>@endif
            @if(!empty($company['tax_id']))
                IF : {{ $company['tax_id'] }}
                @if(!empty($company['ice'])) &nbsp;- ICE : {{ $company['ice'] }}@endif
            @elseif(!empty($company['ice']))
                ICE : {{ $company['ice'] }}
            @endif
        </div>
    </td>
    <td style="width:45%; vertical-align:top; text-align:right">
        <div class="doc-label">BON DE COMMANDE</div>
        <div class="doc-num">{{ $invoice->code }}</div>
        <div class="doc-meta">
            <table>
                <tr>
                    <td class="ml">Date</td>
                    <td class="mr">{{ $invoice->created_at->format('d/m/Y H:i') }}</td>
                </tr>
                <tr>
                    <td class="ml">Statut</td>
                    <td class="mr">
                        @if($invoice->status === 'paid')
                            <span class="stamp stamp-paid">Payee</span>
                        @elseif($invoice->status === 'partial')
                            <span class="stamp stamp-partial">Partielle</span>
                        @else
                            <span class="stamp stamp-unpaid">Impayee</span>
                        @endif
                    </td>
                </tr>
            </table>
        </div>
    </td>
</tr></table>

{{-- SUPPLIER / SUMMARY --}}
<table class="bts"><tr>
    <td style="width:48%; padding-right:20px">
        <div class="section-lbl">Fournisseur</div>
        <div class="party-name">{{ $invoice->supplier->nom }}</div>
        <div class="party-detail">
            @if($invoice->supplier->email){{ $invoice->supplier->email }}<br>@endif
            @if($invoice->supplier->telephone)Tel : {{ $invoice->supplier->telephone }}<br>@endif
            @if($invoice->supplier->adresse){{ $invoice->supplier->adresse }}<br>@endif
            @if($invoice->supplier->ville){{ $invoice->supplier->ville }}@endif
        </div>
    </td>
    <td style="width:52%">
        <div class="section-lbl">Recapitulatif</div>
        <table class="sum-tbl" style="margin-top:4px">
            <tr>
                <td class="sum-l">Total TTC</td>
                <td class="sum-r">{{ number_format((float)$invoice->total_amount,2,',',' ') }} MAD</td>
            </tr>
            <tr>
                <td class="sum-l">Montant paye</td>
                <td class="sum-r green">{{ number_format((float)$invoice->paid_amount,2,',',' ') }} MAD</td>
            </tr>
            @if((float)$invoice->remaining_amount > 0)
            <tr class="sum-divider">
                <td class="sum-l bold">Reste du</td>
                <td class="sum-r red sum-big">{{ number_format((float)$invoice->remaining_amount,2,',',' ') }} MAD</td>
            </tr>
            @else
            <tr class="sum-divider">
                <td class="sum-l bold">Solde</td>
                <td class="sum-r green sum-big">Solde</td>
            </tr>
            @endif
        </table>
    </td>
</tr></table>

{{-- ITEMS TABLE --}}
<table class="it">
    <thead>
        <tr>
            <th style="width:26px">#</th>
            <th>Designation</th>
            <th class="c" style="width:46px">Qte</th>
            <th class="r" style="width:110px">Prix unit.</th>
            <th class="r" style="width:110px">Montant HT</th>
        </tr>
    </thead>
    <tbody>
        @foreach($invoice->items as $i => $item)
        <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
            <td class="num c">{{ $i + 1 }}</td>
            <td class="bold">{{ $item->product_name }}</td>
            <td class="c">{{ $item->quantity }}</td>
            <td class="r">{{ number_format((float)$item->unit_price,2,',',' ') }} MAD</td>
            <td class="r bold">{{ number_format((float)$item->total_price,2,',',' ') }} MAD</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr>
            <td colspan="4">Total articles : {{ $invoice->items->count() }}</td>
            <td class="r">{{ number_format($invoice->items->sum('total_price'),2,',',' ') }} MAD</td>
        </tr>
    </tfoot>
</table>

{{-- TOTALS --}}
<table class="tot-outer"><tr>
    <td style="width:55%">&nbsp;</td>
    <td style="width:45%; vertical-align:top">
        <table class="tot-box" style="width:100%">
            @if((float)$invoice->tax_amount > 0)
            <tr><td>
                <table class="tot-row" style="width:100%"><tr>
                    <td class="tot-l">Sous-total HT</td>
                    <td class="tot-r">{{ number_format((float)$invoice->subtotal,2,',',' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="tot-row" style="width:100%"><tr>
                    <td class="tot-l">TVA</td>
                    <td class="tot-r amber">{{ number_format((float)$invoice->tax_amount,2,',',' ') }} MAD</td>
                </tr></table>
            </td></tr>
            @endif
            <tr><td>
                <table class="tot-row" style="width:100%"><tr>
                    <td class="tot-l">Total TTC</td>
                    <td class="tot-r">{{ number_format((float)$invoice->total_amount,2,',',' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="tot-row" style="width:100%"><tr>
                    <td class="tot-l">Montant paye</td>
                    <td class="tot-r green">- {{ number_format((float)$invoice->paid_amount,2,',',' ') }} MAD</td>
                </tr></table>
            </td></tr>
            <tr><td>
                <table class="tot-final" style="width:100%"><tr>
                    <td class="tot-fl">Reste du</td>
                    <td class="tot-fr">{{ number_format((float)$invoice->remaining_amount,2,',',' ') }} MAD</td>
                </tr></table>
            </td></tr>
        </table>
    </td>
</tr></table>

{{-- PAYMENTS --}}
@if($invoice->payments->count())
<div class="pay-title">Historique des paiements</div>
<table class="pay">
    <thead><tr>
        <th>Date</th>
        <th>Methode</th>
        <th>Reference</th>
        <th>Notes</th>
        <th class="r">Montant</th>
    </tr></thead>
    <tbody>
        @foreach($invoice->payments as $p)
        <tr>
            <td class="bold">{{ $p->created_at->format('d/m/Y H:i') }}</td>
            <td>{{ $p->paymentMethod ? $p->paymentMethod->name : '-' }}</td>
            <td style="color:#94a3b8">{{ $p->reference ?? '-' }}</td>
            <td style="color:#94a3b8;font-style:italic">{{ $p->notes ?? '-' }}</td>
            <td class="r">{{ number_format((float)$p->amount,2,',',' ') }} MAD</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot><tr>
        <td colspan="4" style="text-align:right">Total regle :</td>
        <td class="r">{{ number_format($invoice->payments->sum('amount'),2,',',' ') }} MAD</td>
    </tr></tfoot>
</table>
@endif

@if($invoice->notes)
<div class="notes-box"><span class="bold">Note :</span> {{ $invoice->notes }}</div>
@endif

{{-- FOOTER --}}
<table class="footer"><tr>
    <td>
        @if(!empty($company['name'])){{ $company['name'] }}@endif
        @if(!empty($company['email'])) - {{ $company['email'] }}@endif
        @if(!empty($company['phone'])) - {{ $company['phone'] }}@endif
    </td>
    <td style="text-align:right">Genere le {{ now()->format('d/m/Y H:i') }}</td>
</tr></table>

</body>
</html>
