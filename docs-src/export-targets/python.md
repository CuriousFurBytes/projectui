---
title: Python · Textual
---

# Python · Textual

[Textual](https://github.com/Textualize/textual) is a Python framework for building TUI apps with a CSS-like layout engine and rich widget library. Install it with `pip install textual`, then run the exported file directly.

## Example Output

```python
from textual.app import App, ComposeResult
from textual.widgets import Static, Button, Input, ListView, ListItem

class MyApp(App):
    CSS = """
    Screen {
        layout: vertical;
    }
    #header {
        width: 100%;
        height: 3;
        background: $primary;
        color: $text;
        border: solid $accent;
    }
    #body {
        layout: horizontal;
        height: 1fr;
    }
    """

    def compose(self) -> ComposeResult:
        yield Static("My Dashboard", id="header")
        with Static(id="body"):
            yield ListView(
                ListItem(Static("Item 1")),
                ListItem(Static("Item 2")),
                id="sidebar",
            )
            yield Static("Main content area", id="main")

if __name__ == "__main__":
    MyApp().run()
```

## Running the Output

```bash
pip install textual
python my_app.py
```

See the [Textual documentation](https://textual.textualize.io/) for the full widget API reference, reactive state, CSS animations, and testing tools.
