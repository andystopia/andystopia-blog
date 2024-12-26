
function Code(text)
  if text.attributes["role"] == "rdoc" then
    local formatted = string.format("<code><a href=\"https://www.rdocumentation.org/packages/base/versions/3.6.2/topics/%s\">%s</a></code>", text.text, text.text)
    return pandoc.RawInline("html", formatted)
  end
  return text
end

