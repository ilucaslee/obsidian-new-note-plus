import {Editor, MarkdownView, normalizePath, Plugin, TFile, TFolder} from 'obsidian';
import {Parameters} from "./types";

export default class NewNotePlus extends Plugin {
    async onload() {
        this.registerObsidianProtocolHandler("new-note-plus", async (e) => {
            const parameters = e as unknown as Parameters;

            for (const parameter in parameters) {
                (parameters as any)[parameter] = decodeURIComponent((parameters as any)[parameter]);
            }
            if (parameters.file) {
                parameters.file = normalizePath(parameters.file);
                parameters.file = parameters.file + ".md";
                this.handleWrite(parameters);
            }
        });
    }

    private getEditor(): Editor | undefined {
        return this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    }

    async handleWrite(parameters: Parameters) {
        const path = parameters.file;
        await this.writeAndOpenFile(path, parameters.content, parameters);
    }

    async writeAndOpenFile(outputFileName: string, text: string, parameters: Parameters): Promise<TFile> {
        const file = this.app.vault.getAbstractFileByPath(outputFileName);
        if (!text) {
            try {
                text = await navigator.clipboard.readText();
            }catch (e) {
                text = '';
            }
        }
        if (file instanceof TFile || file instanceof TFolder) {
            // await this.app.vault.modify(file, text);
            //TODO do sth to rename the new file name
        } else {
            const parts = outputFileName.split("/");
            const dir = parts.slice(0, parts.length - 1).join("/");
            if (parts.length > 1 && !(this.app.vault.getAbstractFileByPath(dir) instanceof TFolder)) {
                await this.app.vault.createFolder(dir);
            }
            await this.app.vault.create(outputFileName, text);
        }

        await this.app.workspace.openLinkText(outputFileName, "", false, undefined);
        // this.app.workspace.getActiveViewOfType(MarkdownView)?.currentMode.clipboardManager.handlePaste;

        // await this.delay(this.settings.delayAfterFileOpening)
        let editor = this.getEditor();
        editor.focus();
        let lastLineNum = editor.getDoc().lastLine();
        const lastLineLength = editor.getLine(lastLineNum).length;
        editor.setCursor(lastLineNum, lastLineLength);

        return this.app.vault.getAbstractFileByPath(outputFileName) as TFile;
    }
}
