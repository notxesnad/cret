import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Add import
imports = "import { renderAgentHeader } from './components/AgentHeader'"
content = content.replace("import { supabase } from '@/utils/supabase'", "import { supabase } from '@/utils/supabase'\n" + imports)

# Remove old function
pattern = re.compile(r'  const renderAgentHeader = \(themeOverride: string \| null = null\) => \{.*?    \}\n  \}\n\n  return \(', re.DOTALL)
content = pattern.sub('  return (', content)

# Replace usage
content = content.replace('renderAgentHeader={renderAgentHeader}', 'renderAgentHeader={(theme) => renderAgentHeader(profile, theme)}')

with open('app/page.tsx', 'w') as f:
    f.write(content)
