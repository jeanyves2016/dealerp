frappe.ui.form.on("Expedition", {
    refresh(frm) {

        if (frm.is_new()) {
            return;
        }

        frm.add_custom_button(__("Facture Client"), () => {
            frappe.new_doc("Sales Invoice", {
                custom_expédition__shipment: frm.doc.name
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
                                <th>Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.sales_invoices.forEach(row => {
                    sales += `
                        <tr>
                            <td><a href="/app/sales-invoice/${row.name}">${row.name}</a></td>
                            <td>${row.customer}</td>
                            <td style="text-align:right">${format_currency(row.grand_total)}</td>
                        </tr>
                    `;
                });

                sales += "</tbody></table>";

                frm.fields_dict.sales_invoices_html.$wrapper.html(sales);

                let purchase = `
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Facture</th>
                                <th>Fournisseur</th>
                                <th>Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.purchase_invoices.forEach(row => {
                    purchase += `
                        <tr>
                            <td><a href="/app/purchase-invoice/${row.name}">${row.name}</a></td>
                            <td>${row.supplier}</td>
                            <td style="text-align:right">${format_currency(row.grand_total)}</td>
                        </tr>
                    `;
                });

                purchase += "</tbody></table>";

                frm.fields_dict.purchase_invoices_html.$wrapper.html(purchase);

            }
        });

    }
});
