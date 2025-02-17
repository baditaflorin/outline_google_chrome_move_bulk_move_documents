import { getOutlineAPI } from './storageManager.js';

let documentTreeData = [];
let documentMap = {};

/**
 * Recursively flattens a nested API response into a flat array.
 * It assigns a parentDocumentId (if not already set) to each child.
 *
 * @param {Array} docs - The array of documents from the API.
 * @param {string|null} parentDocumentId - The parent document ID.
 * @returns {Array} A flat array of documents.
 */
function flattenApiDocs(docs, parentDocumentId = null) {
    let flat = [];
    docs.forEach(doc => {
        // If a parentDocumentId is passed and the doc doesn't already have one, assign it.
        if (parentDocumentId && !doc.parentDocumentId) {
            doc.parentDocumentId = parentDocumentId;
        }
        // Create a shallow copy of the document without its nested children.
        const { children, ...docWithoutChildren } = doc;
        flat.push(docWithoutChildren);
        // Recursively flatten any children.
        if (doc.children && doc.children.length > 0) {
            flat = flat.concat(flattenApiDocs(doc.children, doc.id));
        }
    });
    return flat;
}

/**
 * Populates a <select> element with options from an array of items.
 *
 * @param {HTMLElement} selectElem - The <select> element to populate.
 * @param {Array} items - Array of items with id and name.
 * @param {boolean} useIndentation - Whether to add indentation to the option text.
 */
function populateDropdown(selectElem, items, useIndentation = false) {
    selectElem.innerHTML = "";
    if (!useIndentation) {
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            selectElem.appendChild(option);
        });
    } else {
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Collection Root";
        selectElem.appendChild(defaultOption);
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = `${" ".repeat(item.indent * 2)}${item.name}`;
            selectElem.appendChild(option);
        });
    }
}

/**
 * Builds a tree structure from a flat list of documents.
 * It resets any existing children array before reconstructing the tree.
 *
 * @param {Array} docs - Flat array of documents.
 * @returns {Array} Array of root documents.
 */
function buildTree(docs) {
    const map = {};
    const roots = [];
    docs.forEach(doc => {
        // Initialize children array (resets any pre-existing children)
        doc.children = [];
        map[doc.id] = doc;
    });
    docs.forEach(doc => {
        if (doc.parentDocumentId && map[doc.parentDocumentId]) {
            map[doc.parentDocumentId].children.push(doc);
        } else {
            roots.push(doc);
        }
    });
    // Store globally so we can find a doc by ID later
    documentMap = map;
    return roots;
}

/**
 * Renders the document tree recursively into a nested <ul> element.
 *
 * @param {Array} tree - The tree structure of documents.
 * @param {HTMLElement} container - The container element for the tree.
 */
function renderDocumentTree(tree, container) {
    container.innerHTML = "";
    const ul = document.createElement("ul");
    tree.forEach(node => {
        ul.appendChild(renderTreeNode(node));
    });
    container.appendChild(ul);
}

/**
 * Recursively creates a tree node <li> element.
 *
 * @param {Object} node - A document node.
 * @returns {HTMLElement} The <li> element representing the node.
 */
function renderTreeNode(node) {
    const li = document.createElement("li");

    // Create the checkbox for the node.
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.docId = node.id;
    li.appendChild(checkbox);

    // Create and append the label.
    const label = document.createElement("span");
    label.textContent = node.title || "(Untitled)";
    li.appendChild(label);

    // If the node has children (i.e. is a folder), propagate checkbox changes to its descendants.
    if (node.children && node.children.length > 0) {
        checkbox.addEventListener("change", () => {
            const descendantCheckboxes = li.querySelectorAll("ul input[type='checkbox']");
            descendantCheckboxes.forEach(childCheckbox => {
                childCheckbox.checked = checkbox.checked;
            });
        });

        // Recursively render the children.
        const ul = document.createElement("ul");
        node.children.forEach(child => {
            ul.appendChild(renderTreeNode(child));
        });
        li.appendChild(ul);
    }
    return li;
}

/**
 * Flattens a tree into a list for populating the destination folder dropdown.
 *
 * @param {Array} tree - The tree structure of documents.
 * @param {number} indent - Current indentation level.
 * @returns {Array} A flat array with document id, name, and indent level.
 */
function flattenTree(tree, indent = 0) {
    let flat = [];
    tree.forEach(node => {
        flat.push({ id: node.id, name: node.title || "(Untitled)", indent });
        if (node.children && node.children.length > 0) {
            flat = flat.concat(flattenTree(node.children, indent + 1));
        }
    });
    return flat;
}

/**
 * Returns an array of selected document IDs from the rendered tree.
 *
 * @returns {Array} Array of document IDs.
 */
function getSelectedDocumentIds() {
    const checkboxes = document.querySelectorAll("#documentTree input[type='checkbox']");
    const selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selected.push(cb.dataset.docId);
        }
    });
    return selected;
}

/**
 * Given the tree data and selected IDs, filters out nodes that are descendants
 * of other selected nodes.
 *
 * @param {Array} tree - The tree structure of documents.
 * @param {Array} selectedIds - The array of selected document IDs.
 * @returns {Array} Top-level selected nodes.
 */
function filterTopLevelSelected(tree, selectedIds) {
    let result = [];
    tree.forEach(node => {
        if (selectedIds.includes(node.id)) {
            result.push(node);
        } else if (node.children && node.children.length > 0) {
            result = result.concat(filterTopLevelSelected(node.children, selectedIds));
        }
    });
    return result;
}

/**
 * Recursively moves a document and its children.
 *
 * @param {Object} api - The Outline API instance.
 * @param {Object} doc - The document to move.
 * @param {string} destCollectionId - The destination collection ID.
 * @param {string} destParentId - The destination parent document ID.
 */
async function moveDocumentRecursively(api, doc, destCollectionId, destParentId) {
    console.log(`Moving document ${doc.id} to collection ${destCollectionId}, parent ${destParentId}`);
    await api.moveDocument(doc.id, destCollectionId, destParentId);
    if (doc.children && doc.children.length > 0) {
        for (const child of doc.children) {
            await moveDocumentRecursively(api, child, destCollectionId, doc.id);
        }
    }
}

/**
 * Loads collections and populates the source and destination collection dropdowns.
 */
async function loadCollections() {
    try {
        const api = await getOutlineAPI();
        const collections = await api.listCollections();
        console.debug("[DEBUG] Collections loaded:", collections);
        populateDropdown(document.getElementById("collectionSelect"), collections);
        populateDropdown(document.getElementById("destinationCollection"), collections);
    } catch (error) {
        console.error("Error loading collections:", error);
        alert("Failed to load collections. Check console for details.");
    }
}

/**
 * Initializes the document mover manager.
 */
async function initManager() {
    try {
        // "Select All" checkbox logic
        const selectAllCheckbox = document.getElementById("selectAllCheckbox");
        selectAllCheckbox.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            const checkboxes = document.querySelectorAll("#documentTree input[type='checkbox']");
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
            });
        });

        // When a source collection is chosen, load its document tree.
        document.getElementById("collectionSelect").addEventListener("change", async (e) => {
            const collectionId = e.target.value;
            console.debug("[DEBUG] Source Collection Selected:", collectionId);
            const api = await getOutlineAPI();
            const docs = await api.getCollectionDocuments(collectionId);
            // Flatten the API response so that nested children are included.
            const flatDocs = flattenApiDocs(docs);
            console.debug("[DEBUG] Flattened docs for source collection:", flatDocs);
            documentTreeData = buildTree(flatDocs);
            renderDocumentTree(documentTreeData, document.getElementById("documentTree"));
        });

        // When a destination collection is chosen, load its documents for folder selection.
        document.getElementById("destinationCollection").addEventListener("change", async (e) => {
            const collectionId = e.target.value;
            const api = await getOutlineAPI();
            const docs = await api.getCollectionDocuments(collectionId);
            // Flatten the API response so that nested children are included.
            const flatDocs = flattenApiDocs(docs);
            // Build the full tree and flatten it for the main dropdown.
            const tree = buildTree(flatDocs);
            const flatList = flattenTree(tree);
            populateDropdown(document.getElementById("destinationFolder"), flatList, true);

            // Clear any existing subfolder dropdown.
            populateDropdown(document.getElementById("destinationSubFolder"), [], false);
        });

        // When the user picks something from the main destinationFolder dropdown...
        document.getElementById("destinationFolder").addEventListener("change", (e) => {
            const folderId = e.target.value;
            // Clear the subfolder dropdown initially.
            populateDropdown(document.getElementById("destinationSubFolder"), [], false);

            if (!folderId) {
                // If the user chose "Collection Root," there's no subfolder.
                return;
            }

            // Look up the chosen folder document from the global map.
            const folderDoc = documentMap[folderId];
            if (folderDoc && folderDoc.children && folderDoc.children.length > 0) {
                // Flatten only the direct children subtree.
                const subTree = folderDoc.children;
                const subList = flattenTree(subTree);
                populateDropdown(document.getElementById("destinationSubFolder"), subList, true);
            }
        });

        // When the user clicks the Move button, process the selected documents.
        document.getElementById("moveBtn").addEventListener("click", async () => {
            const selectedIds = getSelectedDocumentIds();
            if (selectedIds.length === 0) {
                alert("Please select at least one document to move.");
                return;
            }
            const topLevelSelected = filterTopLevelSelected(documentTreeData, selectedIds);
            const destCollectionId = document.getElementById("destinationCollection").value;
            // Check both dropdowns: use subfolder if selected, otherwise the main folder.
            let destFolderId = document.getElementById("destinationSubFolder").value;
            if (!destFolderId) {
                destFolderId = document.getElementById("destinationFolder").value;
            }

            if (!destCollectionId) {
                alert("Please select a destination collection.");
                return;
            }

            const api = await getOutlineAPI();
            for (const doc of topLevelSelected) {
                await moveDocumentRecursively(api, doc, destCollectionId, destFolderId);
            }
            alert("Documents moved successfully!");

            // Refresh the source tree.
            const sourceCollectionId = document.getElementById("collectionSelect").value;
            const docs = await api.getCollectionDocuments(sourceCollectionId);
            const flatDocs = flattenApiDocs(docs);
            documentTreeData = buildTree(flatDocs);
            renderDocumentTree(documentTreeData, document.getElementById("documentTree"));
        });

        // Attach event listener to the Refresh Collections button.
        document.getElementById("refreshCollections").addEventListener("click", loadCollections);

    } catch (error) {
        console.error("Error initializing Document Mover:", error);
        alert("Failed to initialize Document Mover. Check console for details.");
    }
}

document.addEventListener("DOMContentLoaded", initManager);
