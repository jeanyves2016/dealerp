frappe.ui.form.on("Expedition", {
    refresh(frm) {

        if (frm.is_new()) {
            return;
        }

        frm.add_custom_button(__("Facture Client"), () => {
            frappe.new_doc("Sales Invoice", {
                custom_expedition_shipment: frm.doc.name
            });
        }, __("Finance"));

        frm.add_custom_button(__("Facture Fournisseur"), () => {
            frappe.new_doc("Purchase Invoice", {
                custom_expedition_shipment: frm.doc.name
            });
        }, __("Finance"));

        frappe.call({
            method: "dealerp.services.expedition_service.get_financial_details",
            args: {
                expedition_name: frm.doc.name
            },
            callback(r) {

                if (!r.message) return;

                let sales = `
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Facture</th>
                                <th>Client</th>
                                <th>Date</th>
                                <th>Échéance</th>
                                <th>Montant</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.sales_invoices.forEach(row => {
                    sales += `
                        <tr>
                            <td><a href="/app/sales-invoice/${row.name}">${row.name}</a></td>
                            <td>${row.customer}</td>
                            <td>${frappe.datetime.str_to_user(row.posting_date)}</td>
                            <td>${frappe.datetime.str_to_user(row.due_date)}</td>
                            <td style="text-align:right">${format_currency(row.grand_total)}</td>
                            <td>
<span class="badge ${
row.status==="Paid" ? "bg-success" :
row.status==="Overdue" ? "bg-danger" :
row.status==="Unpaid" ? "bg-warning text-dark" :
row.status==="Draft" ? "bg-secondary" :
"bg-info"
}">
${
row.status==="Paid" ? "Payée" :
row.status==="Overdue" ? "Impayée (échéance dépassée)" :
row.status==="Unpaid" ? "Impayée" :
row.status==="Draft" ? "Brouillon" :
row.status==="Submitted" ? "Validée" :
row.status==="Cancelled" ? "Annulée" :
row.status
}
</span>
</td>
                        </tr>
                    `;
                });

                
sales += `
</tbody>
<tfoot>
<tr style="font-weight:bold;background:#f8f9fa">
<td colspan="2">TOTAL</td>
<td style="text-align:right">${format_currency(
    r.message.sales_invoices.reduce((t,x)=>t+(x.grand_total||0),0)
)}</td>
<td></td>
</tr>
</tfoot>
</table>`;


                frm.fields_dict.sales_invoices_html.$wrapper.html(sales);

                let purchase = `
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Facture</th>
                                <th>Fournisseur</th>
                                <th>Date</th>
                                <th>Échéance</th>
                                <th>Montant</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.purchase_invoices.forEach(row => {
                    purchase += `
                        <tr>
                            <td><a href="/app/purchase-invoice/${row.name}">${row.name}</a></td>
                            <td>${row.supplier}</td>
                            <td>${frappe.datetime.str_to_user(row.posting_date)}</td>
                            <td>${frappe.datetime.str_to_user(row.due_date)}</td>
                            <td style="text-align:right">${format_currency(row.grand_total)}</td>
                            <td>
<span class="badge ${
row.status==="Paid" ? "bg-success" :
row.status==="Overdue" ? "bg-danger" :
row.status==="Unpaid" ? "bg-warning text-dark" :
row.status==="Draft" ? "bg-secondary" :
"bg-info"
}">
${
row.status==="Paid" ? "Payée" :
row.status==="Overdue" ? "Impayée (échéance dépassée)" :
row.status==="Unpaid" ? "Impayée" :
row.status==="Draft" ? "Brouillon" :
row.status==="Submitted" ? "Validée" :
row.status==="Cancelled" ? "Annulée" :
row.status
}
</span>
</td>
                        </tr>
                    `;
                });

                
purchase += `
</tbody>
<tfoot>
<tr style="font-weight:bold;background:#f8f9fa">
<td colspan="2">TOTAL</td>
<td style="text-align:right">${format_currency(
    r.message.purchase_invoices.reduce((t,x)=>t+(x.grand_total||0),0)
)}</td>
<td></td>
</tr>
</tfoot>
</table>`;


                frm.fields_dict.purchase_invoices_html.$wrapper.html(purchase);

            }
        });

    }
});
