---
title: Go · Bubble Tea
---

# Go · Bubble Tea

[Bubble Tea](https://github.com/charmbracelet/bubbletea) is the Elm-architecture TUI framework from [Charm](https://charm.sh/). [Lip Gloss](https://github.com/charmbracelet/lipgloss) handles styling (borders, colors, alignment). The exported code targets Go 1.21+.

## Example Output

```go
package main

import (
    "fmt"
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
)

var (
    headerStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("#7aa2f7")).
        Border(lipgloss.RoundedBorder()).
        Width(80)
)

type model struct{ items []string }

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        if msg.String() == "q" { return m, tea.Quit }
    }
    return m, nil
}

func (m model) View() string {
    return headerStyle.Render("My Dashboard")
}

func main() {
    p := tea.NewProgram(model{})
    if _, err := p.Run(); err != nil {
        fmt.Printf("error: %v\n", err)
    }
}
```

## Running the Output

```bash
go mod init myapp
go get github.com/charmbracelet/bubbletea
go get github.com/charmbracelet/lipgloss
go run main.go
```

See the [Bubble Tea examples](https://github.com/charmbracelet/bubbletea/tree/master/examples) and [Lip Gloss documentation](https://github.com/charmbracelet/lipgloss) for the full API reference.
