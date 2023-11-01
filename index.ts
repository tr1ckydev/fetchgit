import { mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { getCurrentRuntime } from "runtimey";

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

async function writeFile(destination: string, contents: string | Response) {
    switch (getCurrentRuntime()) {
        case "bun":
            //@ts-expect-error
            await Bun.write(destination, contents);
            break;
        case "deno":
            if (contents instanceof Response) contents = await contents.text();
            //@ts-expect-error
            await Deno.writeTextFile(destination, contents);
            break;
        case "node":
            if (contents instanceof Response) contents = await contents.text();
            writeFileSync(destination, contents);
            break;
    }
}

export async function fetchFile(config: FileConfig) {
    if (!config.branch) {
        config.branch = (await (await fetch(`https://api.github.com/repos/${config.repo}`)).json()).default_branch;
    }
    await writeFile(`${config.destination}/${basename(config.path)}`, await fetch(`https://raw.githubusercontent.com/${config.repo}/${config.branch}/${config.path}`));
}

export async function fetchDirectory(config: DirectoryConfig) {
    const contents = await (await fetch(`https://api.github.com/repos/${config.repo}/contents/${config.path ?? ""}`)).json<GitHubContents[]>();
    mkdirSync(`${config.destination}/${config.path ?? ""}`, { recursive: true });
    for (const content of contents) {
        switch (content.type) {
            case "file":
                writeFile(`${config.destination}/${content.path}`, await fetch(content.download_url));
                break;
            case "dir":
                fetchDirectory({
                    repo: config.repo,
                    path: content.path,
                    destination: config.destination
                });
                break;
        }
    }
}