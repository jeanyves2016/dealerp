from dealerp.financial import recalculate_expedition


def _recalc(doc):
    if doc.custom_expedition_shipment:
        recalculate_expedition(doc.custom_expedition_shipment)


def on_submit(doc, method):
    _recalc(doc)


def on_cancel(doc, method):
    _recalc(doc)


def on_update_after_submit(doc, method):
    _recalc(doc)


def on_trash(doc, method):
    _recalc(doc)
