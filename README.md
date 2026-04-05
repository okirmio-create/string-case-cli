# string-case-cli

Convert strings between naming conventions from the command line.

## Install

```bash
npm install -g string-case-cli
```

## Usage

```bash
# Convert a string — shows all case variants
string-case "hello world"

# Convert camelCase input
string-case myVariableName

# Convert to a specific case only
string-case "hello world" --to kebab
string-case "hello world" --to snake

# Output as JSON
string-case "hello world" --json

# Copy result to clipboard
string-case "hello world" --to camel --copy

# Process a file line by line
string-case --file names.txt

# List all supported case types
string-case --list
```

## Supported Cases

| Case                | Example           |
| ------------------- | ----------------- |
| camelCase           | helloWorld        |
| PascalCase          | HelloWorld        |
| snake_case          | hello_world       |
| SCREAMING_SNAKE_CASE| HELLO_WORLD       |
| kebab-case          | hello-world       |
| SCREAMING-KEBAB-CASE| HELLO-WORLD       |
| dot.case            | hello.world       |
| path/case           | hello/world       |
| Title Case          | Hello World       |
| Sentence case       | Hello world       |
| UPPER CASE          | HELLO WORLD       |
| lower case          | hello world       |

## Options

| Flag            | Description                        |
| --------------- | ---------------------------------- |
| `-t, --to`      | Output only a specific case        |
| `-f, --file`    | Process a file line by line        |
| `-j, --json`    | Output as JSON                     |
| `-c, --copy`    | Copy result to clipboard           |
| `-l, --list`    | List all supported case types      |
| `-V, --version` | Show version                       |
| `-h, --help`    | Show help                          |

## Auto-detection

The tool automatically detects the input case type and displays it alongside the conversions.

## License

MIT
