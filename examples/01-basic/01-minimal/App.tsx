import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";

export default function App() {
  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "codeBlock",
        content: 'console.log("Hello, world!");',
        props: {
          language: "javascript",
        },
      },
      {
        type: "codeBlock",
        content: `async function main() {
  while (true) {
    await sleep();
  }
}`,
        props: {
          language: "javascript",
        },
      },
    ],
  });

  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} />;
}
