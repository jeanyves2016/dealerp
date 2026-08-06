frappe.ui.form.on("Dossier", {
    refresh(frm) {

        if (frm.is_new()) return;

        frappe.call({
            method: "dealerp.services.expedition_service.get_dossier_dashboard",
            args: {
                dossier_name: frm.doc.name
            },
            callback(r) {

                if (!r.message) return;

                frm.set_value("expedition_count", r.message.expedition_count);
                frm.set_value("invoiced_revenue", r.message.invoiced_revenue);
                frm.set_value("total_cost", r.message.total_cost);
                frm.set_value("actual_margin", r.message.actual_margin);
                frm.set_value("profitability_percent", r.message.profitability_percent);

                let html = `
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Expédition</th>
                                <th>Opération</th>
                                <th>Transport</th>
                                <th>CA</th>
                                <th>Coût</th>
                                <th>Marge</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.expeditions.forEach(row => {

                    html += `
                        <tr>
                            <td><a href="/app/expedition/${row.name}">${row.name}</a></td>
                            <td>${row.operation_type || ""}</td>
                            <td>${row.mode_transport || ""}</td>
                            <td style="text-align:right">${format_currency(row.invoiced_revenue)}</td>
                            <td style="text-align:right">${format_currency(row.total_cost)}</td>
                            <td style="text-align:right">${format_currency(row.actual_margin)}</td>
                        </tr>
                    `;

                });

                html += "</tbody></table>";

                frm.fields_dict.expeditions_html.$wrapper.html(html);

            }
        });

    }
});
