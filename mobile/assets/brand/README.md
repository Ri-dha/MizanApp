Interim artwork until the brand icon is chosen: a balance (ميزان) on the brand blue `#2e62c9`.
Render the PNGs in `assets/images` from these SVGs (white glyph on transparent where Android and
the splash screen need it):

    swiftc -O render.swift -o /tmp/render
    /tmp/render icon.svg ../images/icon.png 1024
    /tmp/render foreground.svg ../images/android-icon-foreground.png 1024
    /tmp/render foreground.svg ../images/android-icon-monochrome.png 1024
    /tmp/render splash-glyph.svg ../images/splash-icon.png 1024

Quick Look (`qlmanage -t`) fills transparency with white, so it is not used.
