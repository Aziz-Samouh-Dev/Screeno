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
.doc-ref   { font-size: 11px; font-weight: 700; color: #be123c; text-align: right; font-family: "Courier New", monospace; margin-top: 3px; }
.doc-meta  { text-align: right; margin-top: 8px; }
.doc-meta table { margin-left: auto; border-collapse: collapse; }
.doc-meta td { padding: 1px 0; font-size: 8px; }
.doc-meta .ml { color: #64748b; padding-right: 10px; }
.doc-meta .mr { font-weight: 700; color: #1e293b; text-align: right; }

.bts { width: 100%; margin-bottom: 14px; }
.bts td { vertical-align: top; }
.section-lbl { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
.party-name   { font-size: 13px; font-weight: 900; color: #1e293b; margin-top: 4px; margin-bottom: 3px; }
.party-detail { font-size: 8px; color: #475569; line-height: 1.8; }

.sum-tbl { width: 100%; border-collapse: collapse; margin-top: 4px; }
.sum-tbl td { padding: 3px 0; font-size: 8.5px; }
.sum-l { color: #64748b; }
.sum-r { text-align: right; font-weight: 700; font-family: "Courier New", monospace; }

.it { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin-bottom: 6px; }
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
.it tfoot td { padding: 7px 10px; font-size: 8.5px; color: #64748b; border-top: 2px solid #cbd5e1; }
.it tfoot td.r { text-align: right; font-family: "Courier New", monospace; font-weight: 700; color: #1e293b; }

.tot-outer { width: 100%; }
.tot-outer td { vertical-align: top; }
.tot-box { border: 1px solid #cbd5e1; border-collapse: collapse; }
.tot-box td { padding: 0; }
.tot-final { width: 100%; border-collapse: collapse; background: #be123c; }
.tot-final td { padding: 10px 12px; }
.tot-final .tl { color: rgba(255,255,255,0.75); font-size: 8px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
.tot-final .tr { text-align: right; color: #fff; font-size: 14px; font-weight: 900; font-family: "Courier New", monospace; }

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
            @if(!empty($company['phone']))Tél : {{ $company['phone'] }}<br>@endif
            @if(!empty($company['email'])){{ $company['email'] }}<br>@endif
            @if(!empty($company['tax_id']))IF : {{ $company['tax_id'] }}
                @if(!empty($company['ice'])) &nbsp;·&nbsp; ICE : {{ $company['ice'] }}@endif
            @elseif(!empty($company['ice']))ICE : {{ $company['ice'] }}@endif
        </div>
    </td>
    <td style="width:45%; vertical-align:top; text-align:right">
        <div class="doc-label">RETOUR DE VENTE</div>
        @if($salesReturn->invoice)
            <div class="doc-ref">Réf. facture : {{ $salesReturn->invoice->code }}</div>
        @endif
        <div class="doc-meta">
            <table>
                <tr><td class="ml">Date du retour</td><td class="mr">{{ $salesReturn->created_at->format('d/m/Y H:i') }}</td></tr>
                <tr><td class="ml">Généré le</td><td class="mr">{{ now()->format('d/m/Y H:i') }}</td></tr>
            </table>
        </div>
    </td>
</tr></table>

{{-- CLIENT / DETAILS --}}
<table class="bts"><tr>
    <td style="width:48%; padding-right:20px">
        <div class="section-lbl">Client</div>
        <div class="party-name">{{ $salesReturn->client->nom }}</div>
        <div class="party-detail">
            @if($salesReturn->client->email)    {{ $salesReturn->client->email }}<br>@endif
            @if($salesReturn->client->telephone)Tél : {{ $salesReturn->client->telephone }}<br>@endif
            @if($salesReturn->client->adresse)  {{ $salesReturn->client->adresse }}<br>@endif
            @if($salesReturn->client->ville)    {{ $salesReturn->client->ville }}@endif
        </div>
    </td>
    <td style="width:52%">
        <div class="section-lbl">Récapitulatif</div>
        <table class="sum-tbl" style="margin-top:4px">
            <tr><td class="sum-l">Nombre d'articles</td><td class="sum-r">{{ $salesReturn->items->count() }}</td></tr>
            @if($salesReturn->invoice)
            <tr><td class="sum-l">Facture d'origine</td><td class="sum-r" style="color:#2563eb">{{ $salesReturn->invoice->code }}</td></tr>
            @endif
            <tr><td class="sum-l bold">Montant remboursé</td><td class="sum-r bold" style="color:#be123c; font-size:11px">{{ number_format((float)$salesReturn->total_amount, 2, ',', ' ') }} MAD</td></tr>
        </table>
    </td>
</tr></table>

{{-- ITEMS TABLE --}}
<table class="it">
    <thead>
        <tr>
            <th style="width:26px">#</th>
            <th>Désignation</th>
            <th class="c" style="width:60px">Qté ret.</th>
            <th class="r" style="width:110px">Prix unitaire</th>
            <th class="r" style="width:110px">Total remboursé</th>
        </tr>
    </thead>
    <tbody>
        @foreach($salesReturn->items as $i => $item)
        <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
            <td class="num c">{{ $i + 1 }}</td>
            <td class="bold">{{ $item->product_name }}</td>
            <td class="c">{{ $item->quantity }}</td>
            <td class="r">{{ number_format((float)$item->unit_price, 2, ',', ' ') }} MAD</td>
            <td class="r bold" style="color:#be123c">{{ number_format((float)$item->total_price, 2, ',', ' ') }} MAD</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr>
            <td colspan="4">Total articles : {{ $salesReturn->items->count() }}</td>
            <td class="r">{{ number_format($salesReturn->items->sum('total_price'), 2, ',', ' ') }} MAD</td>
        </tr>
    </tfoot>
</table>

{{-- TOTAL --}}
<table class="tot-outer"><tr>
    <td style="width:55%">&nbsp;</td>
    <td style="width:45%; vertical-align:top">
        <table class="tot-box" style="width:100%">
            <tr><td>
                <table class="tot-final" style="width:100%"><tr>
                    <td class="tl">Total remboursé</td>
                    <td class="tr">{{ number_format((float)$salesReturn->total_amount, 2, ',', ' ') }} MAD</td>
                </tr></table>
            </td></tr>
        </table>
    </td>
</tr></table>

@if($salesReturn->notes)
<div class="notes-box"><span class="bold">Note :</span> {{ $salesReturn->notes }}</div>
@endif

{{-- FOOTER --}}
<table class="footer"><tr>
    <td>
        @if(!empty($company['name'])){{ $company['name'] }}@endif
        @if(!empty($company['email'])) &nbsp;·&nbsp; {{ $company['email'] }}@endif
        @if(!empty($company['phone'])) &nbsp;·&nbsp; {{ $company['phone'] }}@endif
    </td>
    <td style="text-align:right">Document généré le {{ now()->format('d/m/Y à H:i') }}</td>
</tr></table>

</body>
</html>
