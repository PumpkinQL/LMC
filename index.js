function get_by_id(id) 
{
    return document.getElementById(id)
}

const text_area = get_by_id("text_area")
const output = get_by_id("output")
const process = get_by_id("process")
const run = get_by_id("run")
const compiled = get_by_id("compiled")
const canvas = get_by_id("canvas")
const clear = get_by_id("clear")
const ctx = canvas.getContext("2d")

const instructions = ["ADD", "SUB", "STA", "LDA", "BRA", "BRZ", "BRP", "INP", "OUT", "HLT", "DAT"]

var complete_tokens = []

clear.addEventListener("click", () => 
{
    text_area.value = ""
})

run.addEventListener("click", () =>
{
    output.innerHTML = "<b>Output</b><br>"
    parse(complete_tokens)
})

process.addEventListener("click", () => 
{
    const tokens = []
    const text = text_area.value + "|"
    var token =
    {
        type: "",
        text: ""
    }

    var line_number = 1

    const num_test = (char) => 
    {
        token.text += char
        if (token.type === "WHITESPACE")
        {
            token.type = "MEMORY"
        }
        else if (!token.type)
        {
            token.type = "VALUE"
        }
        else 
        {
            throw_error("Error on line " + line_number + ": " + token.text + " is not a valid token")
            return false
        }

        return true
    }

    const end_token = () =>
    {
        if (!token.type)
        {
            return
        }

        if (token.type !== "WHITESPACE")
        {
            if (instructions.includes(token.text))
            {
                token.type = "INSTRUCTION"
                tokens.push({...token})
            }
            else if (token.type === "LINE_BREAK" || token.type === "MEMORY")
            {
                tokens.push({...token})
            }
            else
            {
                if (token.text.match(/^[0-9]+$/))
                {
                    token.type = "VALUE"
                    tokens.push({...token})
                }
                else
                {
                    token.type = "GOTO"
                    tokens.push({...token})
                }
            }
        }

        token.type = ""
        token.text = ""
    }

    for (const char of text)
    {
        switch (char)
        {
            case " ":
                end_token()
                token.type = "WHITESPACE"
                break;
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                if (!num_test(char)) 
                {
                    return
                }
                break;
            case "|":
                end_token()
            case "\n":
                line_number++
                end_token()
                token.type = "LINE_BREAK"
                token.text = ""
                end_token()
                break;
            default:
                token.text += char
                if (!token.type || token.type === "WHITESPACE")
                {
                    token.type = "UNKNOWN"
                }
                else if (token.text.length > 3)
                {
                    token.type = "GOTO"
                }
                //else if (token.type === "WHITESPACE")
                //{
                    //if (token.text.length === 3)
                    //{
                    //    throw_error("Instruction too long. At Line: " + line_number)
                    //    return
                    //}

                    //token.text += char
                    //token.type = "INSTRUCTION"
                    //if (token.text.length === 3 && !instructions.includes(token.text))
                    //{
                      //  throw_error("Invalid instruction. At Line: " + line_number)
                      //  return
                    //}
                //}
        }
    }

    verify_tokens(tokens, line_number)
    print_tokens(tokens)

    complete_tokens = tokens
    run.disabled = false
})

function parse(tokens)
{
    var line_number = 1
    var memory = []
    var accumulator = 0
    var previous = ""
    var value = 0

    var gotos = []
    var condition = false

    for (var i = 0; i < 100; i++)
    {
        memory.push(Math.floor(Math.random() * 1000))
    }

    for (var i = 0; i < tokens.length; i++)
    {
        if (tokens[i].type === "GOTO" && !gotos.find(goto => goto.abr === tokens[i].text))
        {
            gotos.push({ abr: tokens[i].text, i})
        }
    }

    for (var i = 0; i < tokens.length; i++)
    {
        const token = tokens[i]

        if (token.type === "LINE_BREAK")
        {
            line_number++
            condition = false
            previous = "NEW_LINE"
            continue
        }

        switch (previous)
        {
            case "BRZ":
            case "BRA":
            case "BRP":
                if (!condition) 
                {   
                    continue
                }

                const goto = gotos.find(goto => goto.abr === token.text)
                if (goto)
                {
                    i = goto.i
                    previous = ""
                    continue
                }
                else
                {
                    throw_error("Could not find the specificed goto. Line: " + line_number)
                    return
                }
            case "GOTO":
                if (token.type === "GOTO")
                {
                    throw_error("Invalid syntax. Line: " + line_number)
                    return
                }
                break;
            case "ADD":
                accumulator += memory[parseInt(token.text)]
                break;
            case "SUB":
                accumulator -= memory[parseInt(token.text)]
                break;
            case "DAT":
                memory[parseInt(token.text)] = value
                break;
            case "LDA":
                if (token.type !== "MEMORY")
                {
                    throw_error("Invalid memory location. At line: " + line_number)
                    return
                }
    
                previous = "MEMORY"
                accumulator = memory[parseInt(token.text)]
                break;
            case "STA":
                if (token.type !== "MEMORY")
                {
                    throw_error("Invalid memory location. At line: " + line_number)
                    return
                }

                memory[parseInt(token.text)] = accumulator
                break;
            
        }

        switch (token.type)
        {
            case "INSTRUCTION":
                if (token.text === "OUT")
                {
                    output.innerHTML += accumulator + "<br>"
                }
                else if (token.text === "DAT")
                {
                    if (previous !== "VALUE")
                    {
                        throw_error("Invalid instruction. At Line: " + line_number)
                    }
                } 
                else if (token.text === "INP")
                {
                    accumulator = parseInt(prompt("Enter a value: "))
                    while (isNaN(accumulator))
                    {
                        accumulator = parseInt(prompt("Enter a value (integer): "))
                    }
                }
                else if (token.text === "HLT")
                {
                    draw_memory(memory)
                    return
                }
                else if (token.text === "BRA")
                {
                    previous = "BRZ"
                    condition = true
                }
                else if (token.text === "BRZ")
                {
                    previous = "BRZ"
                    condition = accumulator === 0
                }
                else if (token.text === "BRP")
                {
                    previous = "BRP"
                    condition = accumulator >= 0
                }

                previous = token.text
                break;
            case "VALUE":
                value = parseInt(token.text)
                previous = "VALUE"
                break;
            case "MEMORY":
                if (previous === "OUT" || previous === "INP")
                {
                    throw_error("Invalid instruction. At Line: " + line_number)
                    return
                }
            default:
                previous = token.type
        }

        if (typeof accumulator === "undefined")
        {
            throw_error("Cannot set accumelator to undefined. Line: " + line_number)
            return
        }
    }

/*     for (const token of tokens)
    {
        if (token.type === "LINE_BREAK")
        {
            line_number++
            previous = "NEW_LINE"
            continue
        }

        switch (previous)
        {
            case "ADD":
                accumulator += memory[parseInt(token.text)]
                break;
            case "SUB":
                accumulator -= memory[parseInt(token.text)]
                break;
            case "DAT":
                memory[parseInt(token.text)] = value
                break;
            case "LDA":
                if (token.type !== "MEMORY")
                {
                    throw_error("Invalid memory location. At line: " + line_number)
                    return
                }
    
                previous = "MEMORY"
                accumulator = memory[parseInt(token.text)]
                break;
            case "STA":
                if (token.type !== "MEMORY")
                {
                    throw_error("Invalid memory location. At line: " + line_number)
                    return
                }

                memory[parseInt(token.text)] = accumulator
                break;
            
        }

        switch (token.type)
        {
            case "INSTRUCTION":
                if (token.text === "OUT")
                {
                    output.innerHTML += accumulator + "<br>"
                }
                else if (token.text === "DAT")
                {
                    if (previous !== "VALUE")
                    {
                        throw_error("Invalid instruction. At Line: " + line_number)
                    }
                } 
                else if (token.text === "INP")
                {
                    accumulator = parseInt(prompt("Enter a value: "))
                    while (isNaN(accumulator))
                    {
                        accumulator = parseInt(prompt("Enter a value (integer): "))
                    }
                }
                else if (token.text === "HLT")
                {
                    return
                }

                previous = token.text
                break;
            case "VALUE":
                value = parseInt(token.text)
                previous = "VALUE"
                break;
            case "MEMORY":
                if (previous === "OUT" || previous === "INP")
                {
                    throw_error("Invalid instruction. At Line: " + line_number)
                    return
                }
        }

        if (typeof accumulator === "undefined")
        {
            throw_error("Cannot set accumelator to undefined. Line: " + line_number)
            return
        }
    } */

    draw_memory(memory)
}

function verify_tokens(tokens, line_number)
{
    for (const token of tokens)
    {
        if (token.type === "INSTRUCTION")
        {
            if (token.text.length !== 3)
            {
                throw_error("Invalid instruction. At Line: " + line_number)
                return false
            }
        }
    }

    return true
}

function print_tokens(tokens)
{
    var text = ""
    for (const token of tokens)
    {
        console.log(token)
        text += `${token.type} ${token.text ? token.text : "<br>"} `
    }

    compiled.innerHTML = `<code> ${text} </code>`
}

function draw_memory(memory)
{
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "white"
    ctx.font = "13px Arial"
    for (var i = 0; i < 100; i++)
    {
        var x = i % 10
        var y = Math.floor(i / 10)

        ctx.strokeStyle = "#4c647d";
        ctx.strokeRect(x * 50, y * 50, 50, 50)

        if (memory[i] !== undefined)
        {
            ctx.fillText(memory[i], (x * 50) + 15, (y * 50) + 25)
            continue
        }

        ctx.fillText(random, (x * 50) + 15, (y * 50) + 25)
    }
}

function throw_error (error) 
{
    alert(error)
}

window.onload = () =>
{
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}