import {Mod} from "./packwiz-utils";

export class ModrinthMod {
    project_id: string
    id: string = ""
    project_type: string
    slug: string
    author: string
    title: string
    description: string

    constructor()
    constructor(project_id = "", project_type = "", slug = "",
                author = "", title = "", description = "") {
        this.project_id = project_id
        this.project_type = project_type
        this.slug = slug
        this.author = author
        this.title = title
        this.description = description
    }

    static fromJSON(d: Object): ModrinthMod {
        const o = Object.assign(new ModrinthMod(), d)
        if (o.id) {
            o.project_id = o.id
        }
        return o
    }

    toMod() {
        return new Mod(this.project_id, this.slug, this.title, this.author, this.description)
    }
}

export class ModrinthMods {
    hits?: ModrinthMod

    constructor()
    constructor(hits?: ModrinthMod) {
        this.hits = hits
    }

    static fromJSON(d: Object): ModrinthMods {
        return Object.assign(new ModrinthMods(), d)
    }
}

export class CurseForgeMod {
    id: number
    name: string
    slug: string
    summary: string

    constructor()
    constructor(id: number = 0, name: string = "", slug: string = "", summary: string = "") {
        this.id = id
        this.name = name
        this.slug = slug
        this.summary = summary
    }

    static fromJSON(d: Object): CurseForgeMod {
        return Object.assign(new CurseForgeMod(), d)
    }

    toMod() {
        return new Mod(this.id.toString(), this.slug, this.name, "", this.summary)
    }
}

export class CurseForgeMods {
    hits?: CurseForgeMod

    constructor()
    constructor(hits?: CurseForgeMod) {
        this.hits = hits
    }

    static fromJSON(d: Object): CurseForgeMods {
        return Object.assign(new CurseForgeMods(), d)
    }
}