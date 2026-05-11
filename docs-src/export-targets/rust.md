---
title: Rust · Ratatui
---

# Rust · Ratatui

[Ratatui](https://github.com/ratatui-org/ratatui) is a Rust TUI library built on [Crossterm](https://github.com/crossterm-rs/crossterm). The generated code uses the immediate-mode rendering model — a `draw()` call on every event.

## Example Output

```rust
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Paragraph},
    Terminal,
};
use crossterm::event::{self, Event, KeyCode};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    crossterm::terminal::enable_raw_mode()?;
    let stdout = std::io::stdout();
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    loop {
        terminal.draw(|f| {
            let chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(3),
                    Constraint::Min(0),
                ])
                .split(f.size());

            let header = Paragraph::new("My Dashboard")
                .block(Block::default()
                    .borders(Borders::ALL)
                    .title(" App "))
                .style(Style::default()
                    .fg(Color::Rgb(122, 162, 247)));
            f.render_widget(header, chunks[0]);
        })?;

        if let Event::Key(key) = event::read()? {
            if key.code == KeyCode::Char('q') { break; }
        }
    }
    crossterm::terminal::disable_raw_mode()?;
    Ok(())
}
```

## Running the Output

```bash
cargo add ratatui crossterm
cargo run
```

See the [Ratatui documentation](https://ratatui.rs/) and [official templates](https://github.com/ratatui-org/templates) for production patterns.
