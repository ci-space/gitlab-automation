// ==UserScript==
// @name         New Tag
// @namespace    none
// @version      2025-02-13
// @description  try to take over the world!
// @author       You
// @match        https://<your-gitlab-instance>/*/-/tags
// @icon         none
// @grant        none
// ==/UserScript==

// config
const BUTTON_NAME = 'New API PKG';
const TAG_PREFIX = 'my-api-pkg/'; // not required
// config

const PROJECT_PATH = getProjectPath();

(function() {
    'use strict';

    const headings = document.querySelector('div[data-testid="page-heading-actions"]')

    const dropdown = document.createElement("div")
    dropdown.setAttribute('class', 'dropdown')

    const button = document.createElement('button')
    setAttributes(button, {
        class: 'btn btn-secondary dropdown-toggle',
        type: 'button',
        id: 'dropdownMenuButton',
        'data-toggle': 'dropdown',
        'aria-haspopup': 'true',
        'aria-expanded': 'false',
    })
    button.innerText = BUTTON_NAME

    const menu = document.createElement('div')
    setAttributes(menu, {
        'class': 'dropdown-menu',
        'aria-labelledby': 'dropdownMenuButton',
    })

    menu.replaceChildren(
        makeDropdownButton('Major', releaseMajor),
        makeDropdownButton('Minor', releaseMinor),
        makeDropdownButton('Patch', releasePatch),
    )

    dropdown.replaceChildren(button, menu)

    insertDropdown(headings, dropdown)
})();

function makeDropdownButton(name, listener) {
    const button = document.createElement('a')

    setAttributes(button, {
        class: 'dropdown-item',
        href: '#',
    })
    button.innerText = name
    button.addEventListener('click', listener)

    return button
}

function insertDropdown(headings, dropdown) {
    const items = []

    let i = 0
    for (const c of headings.childNodes) {
        if (i === headings.childNodes.length - 2) {
            items.push(dropdown)
        }

        items.push(c)

        i++
    }

    headings.replaceChildren(...items)
}

function setAttributes(node, values) {
    for (const key in values) {
        node.setAttribute(key, values[key])
    }
}

//////////////////////////////////////////////////
//                     GETTERS
//////////////////////////////////////////////////

function getProjectPath() {
    const suffix = '/-/'
    const prefix = window.location.protocol + '//' + window.location.host

    const right = window.location.href.substring(prefix.length)

    return right.substring(1, right.indexOf(suffix))
}

//////////////////////////////////////////////////
//                     VERSION
//////////////////////////////////////////////////

function extractVersion(tag) {
    if (TAG_PREFIX !== "") {
        tag = tag.substring(TAG_PREFIX.length)
    }

    if (tag.at(0) === 'v') {
        tag = tag.substring(1)
    }

    const parts = tag.split('.', 3)
    if (parts.length < 3) {
        return null
    }

    return {
        major: parseInt(parts[0]),
        minor: parseInt(parts[1]),
        patch: parseInt(parts[2]),
    }
}

//////////////////////////////////////////////////
//                     API
//////////////////////////////////////////////////

function releaseMajor() {
    release(function (version) {
        if (version === null) {
            return 'v1.0.0'
        }

        return {
            major: version.major + 1,
            minor: 0,
            patch: 0,
        }
    })
}

function releaseMinor() {
    release(function (version) {
        if (version === null) {
            return 'v0.1.0'
        }

        return {
            major: version.major,
            minor: version.minor + 1,
            patch: 0,
        }
    })
}

function releasePatch() {
    release(function (version) {
        if (version === null) {
            return 'v0.1.0'
        }

        return {
            major: version.major,
            minor: version.minor,
            patch: version.patch + 1,
        }
    })
}

function release(upper) {
    const tags = listTags()

    console.log(`fetched ${tags.length} tags`)

    let newVersion = ""
    if (tags.length > 0) {
        const lastVersion = extractVersion(tags[0].name)

        console.log(`last version is ${lastVersion.major}.${lastVersion.minor}.${lastVersion.patch}`)

        newVersion = upper(lastVersion)
    } else {
        newVersion = upper(null)
    }

    const newTag = `${TAG_PREFIX}${newVersion.major}.${newVersion.minor}.${newVersion.patch}`

    console.log(`new tag is ${newTag}`)

    redirectToNewTagForm(newTag)
}

function listTags() {
    let url = `${window.location.protocol}//${window.location.host}/api/v4/projects/${encodeURIComponent(PROJECT_PATH)}/repository/tags`
    if (TAG_PREFIX !== '') {
        url += `?search=^${TAG_PREFIX}`
    }

    const xmlHttp = new XMLHttpRequest();

    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);

    return JSON.parse(xmlHttp.responseText)
}

function redirectToNewTagForm(tag) {
    window.location.href = `${window.location.protocol}//${window.location.host}/${PROJECT_PATH}/-/tags/new?tag_name=${tag}`
}
