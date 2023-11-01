# fetchgit
Easily download files and directories from a GitHub repository.

- Works in Node.JS, Bun and Deno.
- Uses fastest runtime specific APIs to write files.
- Faster than `git clone` for smaller repositories.



### Fetching a specific directory from a repository

Recursively fetches the directory for all the files and subdirectories inside.

```ts
import { fetchDirectory } from "fetchgit";

await fetchDirectory({
    repo: "chalk/chalk",
    path: "source/vendor/supports-color",
    destination: "./chalk"
});
```



### Fetching an entire repository

If `path` isn't provided, it will fetch the entire repository.

```ts
import { fetchDirectory } from "fetchgit";

await fetchDirectory({
    repo: "tr1ckydev/hyperimport",
    destination: "./hyperimport"
});
```

> **NOTE**
>
> If the repository is small (i.e. has less number of files), it can be faster than `git clone` in most cases but will take way too much time for larger repositories.



### Fetching a single file from a repository

*(Requires destination directory to be created already.)*

```ts
import { fetchFile } from "fetchgit";

await fetchFile({
    repo: "oven-sh/bun",
    path: "README.md",
    branch: "main",
    destination: "./temp"
});
```

If `branch` isn't provided, the default branch name of the repository is fetched and then the file.

> **NOTE**
>
> Explicitly mentioning the branch name will skip the above step, making it faster to fetch the file.



## License

This repository uses MIT license. See [LICENSE](https://github.com/tr1ckydev/fetchgit/blob/main/LICENSE) for full license text.
