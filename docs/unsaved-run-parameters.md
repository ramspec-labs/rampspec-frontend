# Leaving edited run parameters

The parameter form compares fixture and timeout against its initial values.
When combined with wizard draft persistence, the baseline is the restored draft
on entry, rather than hard-coded defaults. Edits remain saved in the scoped tab
draft; the warning concerns changes not yet reviewed for submission. Leaving
does not erase that draft. Review safety accepts the current parameters without
a duplicate warning.
Equivalent numeric timeouts and reverting edits do not warn. Empty/invalid
changes remain dirty. Advancing through Review safety is an intentional form
commit; native number constraints must pass before navigation.

Ordinary same-tab links are intercepted while dirty and display an accessible
confirmation. Stay retains edits and restores focus to the activating link.
Leave follows that link once and bypasses a duplicate unload prompt. The dialog
labels its warning, initially focuses Stay, traps Tab/Shift+Tab and handles Escape.
Hash links, downloads, modified clicks and new-tab links do not discard the page
and are left alone. No confirmation appears for unchanged values.

Native document navigation (reload, closing the tab, back and forward) uses the
browser's beforeunload confirmation. Browser-controlled wording and whether a
prompt appears depend on the browser and prior user interaction. The repository's
parameter workflow uses document navigation; this does not install a global
history patch or claim to block arbitrary programmatic SPA router navigation.
All event listeners are removed when leaving the form. No API calls, credentials
or backend behavior change.
