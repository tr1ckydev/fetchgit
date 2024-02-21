import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { currentRuntime } from "runtimey";

interface FileConfig {
    repo: string,
    branch?: string,
    path: string,
    destination: string,
}

interface DirectoryConfig {
    repo: string,
    path?: string,
    destination: string,
    basedir_only?: boolean,
}

interface GitHubContents {
    name: string,
    path: string,
    sha: string,
    size: number,
    url: string,
    html_url: string,
    git_url: string,
    download_url: string,
    type: "file" | "dir",
    _links: {
        self: string,
        git: string,
        html: string,
    },
}

async function writeFile(destination: string, contents: Response) {
    switch (currentRuntime) {
        case "bun":
            await Bun.write(destination, contents);
            break;
        case "deno":
            //@ts-expect-error
            await Deno.writeTextFile(destination, await contents.text());
            break;
        case "node":
            writeFileSync(destination, await contents.text());
            break;
        default:
            throw new Error("Not supported");
    }
}

export async function fetchFile(config: FileConfig) {
    if (!config.branch) {
        //@ts-ignore
        config.branch = (await (await fetch(`https://api.github.com/repos/${config.repo}`)).json()).default_branch;
    }
    await writeFile(`${config.destination}/${basename(config.path)}`, await fetch(`https://raw.githubusercontent.com/${config.repo}/${config.branch}/${config.path}`));
}

export async function fetchDirectory(config: DirectoryConfig) {
    if (config.basedir_only && !config.path) throw "path must be specified when basedir_only is true";
    const contents = await (await fetch(`https://api.github.com/repos/${config.repo}/contents/${config.path ?? ""}`)).json() as GitHubContents[];
    const parent_dir = config.basedir_only ? dirname(config.path ?? "") : "";
    const dir_path = `${config.destination}/${config.basedir_only ? config.path?.replace(parent_dir, "") ?? "" : config.path ?? ""}`;
    mkdirSync(dir_path, { recursive: true });
    for (const content of contents) {
        switch (content.type) {
            case "file":
                writeFile(`${config.destination}/${config.basedir_only ? content.path.replace(parent_dir, "") : content.path}`, await fetch(content.download_url));
                break;
            case "dir":
                fetchDirectory({
                    repo: config.repo,
                    path: content.path,
                    destination: config.basedir_only ? dir_path : config.destination,
                    basedir_only: config.basedir_only,
                });
                break;
        }
    }
}