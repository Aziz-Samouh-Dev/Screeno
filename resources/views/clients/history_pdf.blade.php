<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }

    .page { padding: 20px 24px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 16px; }
    .header-left h1 { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .header-left p  { font-size: 10px; color: #94a3b8; margin-top: 3px; }
    .header-right   { text-align: right; }
    .header-right .company-name { font-size: 13px; font-weight: 900; color: #0f172a; }
    .header-right p { font-size: 9px; color: #64748b; margin-top: 2px; }

    /* Client info */
    .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .client-box .label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
    .client-box .name  { font-size: 14px; font-weight: 900; color: #0f172a; }
    .client-box .info  { font-size: 9px; color: #64748b; margin-top: 2px; }
    .client-box .summary p { font-size: 10px; color: #475569; margin-bottom: 3px; }
    .client-box .summary .balance { font-size: 12px; font-weight: 900; margin-top: 6px; }

    /* Section headers */
    .section { margin-bottom: 18px; }
    .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 5px; border-bottom: 2px solid; margin-bottom: 10px; }
    .section-title.blue   { color: #1d4ed8; border-color: #bfdbfe; }
    .section-title.green  { color: #15803d; border-color: #bbf7d0; }
    .section-title.purple { color: #7e22ce; border-color: #e9d5ff; }

    /* Invoice card */
    .inv-card { border: 1px solid #e2e8f0; border-radius: 5px; margin-bottom: 10px; overflow: hidden; page-break-inside: avoid; }
    .inv-header { background: #eff6ff; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center; }
    .inv-code   { font-weight: 900; color: #1e40af; font-size: 11px; }
    .inv-meta   { font-size: 9px; color: #64748b; margin-left: 10px; }
    .badge      { font-size: 8px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .badge-paid     { background: #dcfce7; color: #15803d; }
    .badge-partial  { background: #fef3c7; color: #b45309; }
    .badge-unpaid   { background: #fee2e2; color: #dc2626; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    th { padding: 5px 10px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    td { padding: 5px 10px; color: #334155; }
    .mono { font-family: "Courier New", monospace; }

    .inv-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 6px 12px; display: flex; justify-content: space-between; font-size: 9px; }
    .inv-footer .total { font-weight: 900; font-size: 10px; }
    .text-green  { color: #15803d; }
    .text-red    { color: #dc2626; }
    .text-purple { color: #7e22ce; }
    .text-blue   { color: #2563eb; }
    .font-bold   { font-weight: 700; }
    .notes { padding: 5px 12px; font-size: 9px; color: #94a3b8; font-style: italic; border-top: 1px solid #f1f5f9; }

    /* Return card */
    .ret-header { background: #faf5ff; }
    .ret-code   { font-weight: 900; color: #6b21a8; }

    /* Grand total */
    .grand-total { border-top: 2px solid #0f172a; padding-top: 12px; margin-top: 18px; }
    .gt-row { display: flex; justify-content: flex-end; margin-bottom: 4px; }
    .gt-label { width: 160px; font-size: 10px; color: #64748b; }
    .gt-value { width: 130px; text-align: right; font-size: 10px; font-weight: 700; font-family: "Courier New", monospace; }
    .gt-balance { border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 4px; }
    .gt-balance .gt-label { font-size: 12px; font-weight: 900; color: #0f172a; }
    .gt-balance .gt-value { font-size: 12px; font-weight: 900; }
    .text-amber { color: #d97706; }
</style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <div class="header">
        <div class="header-left">
            <h1>HISTORIQUE CLIENT</h1>
            <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
        </div>
        <div class="header-right">
            @if(!empty($company['name']))
                <div class="company-name">{{ $company['name'] }}</div>
            @endif
            @if(!empty($company['address']))  <p>{{ $company['address'] }}</p> @endif
            @if(!empty($company['city']))     <p>{{ $company['city'] }}</p> @endif
            @if(!empty($company['phone']))    <p>{{ $company['phone'] }}</p> @endif
            @if(!empty($company['tax_id']))   <p>IF : {{ $company['tax_id'] }}</p> @endif
            @if(!empty($company['ice']))      <p>ICE : {{ $company['ice'] }}</p> @endif
        </div>
    </div>

    {{-- Client info --}}
    <div class="client-box">
        <div>
            <div class="label">Client</div>
            <div class="name">{{ $client->nom }}</div>
            @if($client->email)     <div class="info">{{ $client->email }}</div> @endif
            @if($client->telephone) <div class="info">{{ $client->telephone }}</div> @endif
            @if($client->adresse)   <div class="info">{{ $client->adresse }}</div> @endif
            @if($client->ville)     <div class="info">{{ $client->ville }}</div> @endif
        </div>
        <div class="summary" style="text-align:right">
            <div class="label">Résumé</div>
            <p>Total facturé : <span class="font-bold">{{ number_format($totalInvoiced, 2, ',', ' ') }} MAD</span></p>
            <p>Total encaissé : <span class="font-bold text-green">{{ number_format($totalPaid, 2, ',', ' ') }} MAD</span></p>
            <p>Total retourné : <span class="font-bold text-purple">{{ number_format($totalReturned, 2, ',', ' ') }} MAD</span></p>
            <div class="balance {{ $balance > 0 ? 'text-amber' : 'text-green' }}">
                Solde : {{ number_format($balance, 2, ',', ' ') }} MAD
            </div>
        </div>
    </div>

    {{-- Factures --}}
    @if($invoices->count())
    <div class="section">
        <div class="section-title blue">Factures de vente ({{ $invoices->count() }})</div>
        @foreach($invoices as $inv)
        <div class="inv-card">
            <div class="inv-header">
                <div>
                    <span class="inv-code mono">{{ $inv['code'] }}</span>
                    <span class="inv-meta">Date : {{ \Carbon\Carbon::parse($inv['invoice_date'])->format('d/m/Y') }}</span>
                </div>
                <span class="badge badge-{{ $inv['status'] }}">
                    {{ $inv['status'] === 'paid' ? 'Payée' : ($inv['status'] === 'partial' ? 'Partielle' : 'Impayée') }}
                </span>
            </div>
            @if(count($inv['items']))
            <table>
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th class="center">Qté</th>
                        <th class="right">P.U.</th>
                        <th class="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($inv['items'] as $item)
                    <tr>
                        <td>{{ $item['product_name'] }}</td>
                        <td class="center">{{ $item['quantity'] }}</td>
                        <td class="right mono">{{ number_format($item['unit_price'], 2, ',', ' ') }} MAD</td>
                        <td class="right mono font-bold">{{ number_format($item['total_price'], 2, ',', ' ') }} MAD</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @endif
            <div class="inv-footer">
                <div>
                    <span>Payé : <span class="font-bold text-green">{{ number_format($inv['paid_amount'], 2, ',', ' ') }} MAD</span></span>
                    &nbsp;&nbsp;
                    <span>Reste : <span class="font-bold {{ $inv['remaining_amount'] > 0 ? 'text-red' : 'text-green' }}">{{ number_format($inv['remaining_amount'], 2, ',', ' ') }} MAD</span></span>
                </div>
                <span class="total">Total TTC : {{ number_format($inv['total_amount'], 2, ',', ' ') }} MAD</span>
            </div>
            @if($inv['notes'])
            <div class="notes">{{ $inv['notes'] }}</div>
            @endif
        </div>
        @endforeach
    </div>
    @endif

    {{-- Retours --}}
    @if($returns->count())
    <div class="section">
        <div class="section-title purple">Retours de vente ({{ $returns->count() }})</div>
        @foreach($returns as $ret)
        <div class="inv-card">
            <div class="inv-header ret-header">
                <div>
                    @if($ret['invoice_code'])
                        <span class="inv-meta">Facture : <span class="mono text-blue">{{ $ret['invoice_code'] }}</span></span>
                    @endif
                    <span class="inv-meta">Date : {{ \Carbon\Carbon::parse($ret['return_date'])->format('d/m/Y') }}</span>
                </div>
                <span class="font-bold text-purple mono">{{ number_format($ret['total_amount'], 2, ',', ' ') }} MAD</span>
            </div>
            @if(count($ret['items']))
            <table>
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th class="center">Qté</th>
                        <th class="right">P.U.</th>
                        <th class="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($ret['items'] as $item)
                    <tr>
                        <td>{{ $item['product_name'] }}</td>
                        <td class="center">{{ $item['quantity'] }}</td>
                        <td class="right mono">{{ number_format($item['unit_price'], 2, ',', ' ') }} MAD</td>
                        <td class="right mono font-bold">{{ number_format($item['total_price'], 2, ',', ' ') }} MAD</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @endif
            @if($ret['notes'])
            <div class="notes">{{ $ret['notes'] }}</div>
            @endif
        </div>
        @endforeach
    </div>
    @endif

    {{-- Paiements --}}
    @if($payments->count())
    <div class="section">
        <div class="section-title green">Paiements ({{ $payments->count() }})</div>
        <table style="border:1px solid #e2e8f0; border-radius:5px;">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Facture</th>
                    <th>Méthode</th>
                    <th>Référence</th>
                    <th>Notes</th>
                    <th class="right">Montant</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payments as $p)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($p['payment_date'])->format('d/m/Y') }}</td>
                    <td class="mono text-blue">{{ $p['invoice_code'] ?? '—' }}</td>
                    <td class="font-bold">{{ $p['payment_method'] ?? '—' }}</td>
                    <td>{{ $p['reference'] ?? '—' }}</td>
                    <td style="color:#94a3b8;font-style:italic">{{ $p['notes'] ?? '—' }}</td>
                    <td class="right mono font-bold text-green">{{ number_format($p['amount'], 2, ',', ' ') }} MAD</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
                    <td colspan="5" style="padding:6px 10px;font-weight:700;text-align:right;color:#475569;">Total paiements :</td>
                    <td class="right mono font-bold text-green" style="padding:6px 10px;">{{ number_format($payments->sum('amount'), 2, ',', ' ') }} MAD</td>
                </tr>
            </tfoot>
        </table>
    </div>
    @endif

    {{-- Grand total --}}
    <div class="grand-total">
        <div class="gt-row">
            <div class="gt-label">Total facturé</div>
            <div class="gt-value">{{ number_format($totalInvoiced, 2, ',', ' ') }} MAD</div>
        </div>
        <div class="gt-row">
            <div class="gt-label" style="color:#7e22ce;">- Total retourné</div>
            <div class="gt-value text-purple">{{ number_format($totalReturned, 2, ',', ' ') }} MAD</div>
        </div>
        <div class="gt-row">
            <div class="gt-label" style="color:#15803d;">- Total encaissé</div>
            <div class="gt-value text-green">{{ number_format($totalPaid, 2, ',', ' ') }} MAD</div>
        </div>
        <div class="gt-row gt-balance">
            <div class="gt-label">Solde dû</div>
            <div class="gt-value {{ $balance > 0 ? 'text-amber' : 'text-green' }}">{{ number_format($balance, 2, ',', ' ') }} MAD</div>
        </div>
    </div>

</div>
</body>
</html>
