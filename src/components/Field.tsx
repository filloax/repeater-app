import React, { useEffect, useState } from 'react';
import tokens from '@contentful/forma-36-tokens';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { v4 as uuid } from 'uuid';
import { Button, Table, FormControl, TextInput, Textarea, IconButton } from "@contentful/f36-components";
import { PlusCircleIcon, DeleteIcon } from "@contentful/f36-icons";
import { Pagination } from '@contentful/f36-pagination';

interface FieldProps {
    sdk: FieldExtensionSDK;
}

/** An Item which represents an list item of the repeater app */
interface Item {
    id: string;
    key: string;
    value: string;
}

/** A simple utility function to create a 'blank' item
 * @returns A blank `Item` with a uuid
*/
function createItem(): Item {
    return {
        id: uuid(),
        key: '',
        value: '',
    };
}

function removeDuplicates(a: number[]) {
    return a.sort((a, b) => a - b).filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

/** The Field component is the Repeater App which shows up 
 * in the Contentful field.
 * 
 * The Field expects and uses a `Contentful JSON field`
 */
const Field = (props: FieldProps) => {
    const { 
        valueName = 'Value', 
        keyName = "Item Name", 
        multiLineValues = false,
        usePagination = false,
        defaultPageItems = 100,
    } = props.sdk.parameters.instance as any;
    const [items, setItems] = useState<Item[]>([]);
    const [page, setPage] = useState(0);
    const [pageItems, setPageItems] = useState(defaultPageItems);

    useEffect(() => {
        // This ensures our app has enough space to render
        props.sdk.window.startAutoResizer();

        // Every time we change the value on the field, we update internal state
        props.sdk.field.onValueChanged((value: Item[]) => {
            if (Array.isArray(value)) {
                setItems(value);
            }
        });
    }, [props.sdk.field, props.sdk.window]);

    /** Adds another item to the list */
    const addNewItem = () => {
        props.sdk.field.setValue([...items, createItem()]);
    };

    const incPage = () => setPage(page + 1);
    const decPage = () => setPage(page - 1);

    /** Creates an `onChange` handler for an item based on its `property`
     * @returns A function which takes an `onChange` event 
    */
    const createOnChangeHandler = (item: Item, property: 'key' | 'value') => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const itemList = items.concat();
        const index = itemList.findIndex((i) => i.id === item.id);

        itemList.splice(index, 1, { ...item, [property]: e.target.value });

        props.sdk.field.setValue(itemList);
    };

    /** Deletes an item from the list */
    const deleteItem = (item: Item) => {
        props.sdk.field.setValue(items.filter((i) => i.id !== item.id));
    };

    let displayItems = items;
    let numPages = 1
    if (usePagination) {
        displayItems = displayItems.slice(page * pageItems, page * pageItems + pageItems)
        numPages = Math.ceil(items.length / pageItems)
    }



    const pagination = (usePagination)
        ? (<Pagination
            activePage={page}
            onPageChange={setPage}
            itemsPerPage={pageItems}
            showViewPerPage
            viewPerPageOptions={removeDuplicates([20, 50, 100, defaultPageItems])}
            onViewPerPageChange={setPageItems}
            totalItems={items.length}
            style={{ marginTop: tokens.spacingS, marginBottom: tokens.spacingS }}
          />)
        : null;

    const newitem = (page === numPages - 1)
        ? (
            <Button
                variant="transparent"
                onClick={addNewItem}
                startIcon={<PlusCircleIcon />}
                style={{ marginTop: tokens.spacingS }}>
                Add Item
            </Button>
        )
        : null;

    const itemInput = (item: Item) => multiLineValues
        ? <Textarea
            name="value"
            value={item.value}
            onChange={createOnChangeHandler(item, 'value')} />
        : <TextInput
            name="value"
            value={item.value}
            onChange={createOnChangeHandler(item, 'value')} />

    return (
        (<div>
            {pagination}
            <Table>
                <Table.Body>
                    {displayItems.map((item) => (
                        <Table.Row key={item.id}>
                            <Table.Cell>
                                <FormControl id="key">
                                    <FormControl.Label>{keyName}</FormControl.Label>
                                    <TextInput name="key" value={item.key} onChange={createOnChangeHandler(item, 'key')} />
                                </FormControl>
                            </Table.Cell>
                            <Table.Cell>
                                <FormControl id="value">
                                    <FormControl.Label>{valueName}</FormControl.Label>
                                    {itemInput(item)}
                                </FormControl>
                            </Table.Cell>
                            <Table.Cell align="right">
                                <IconButton
                                    icon={<DeleteIcon variant="muted"/>}
                                    aria-label="delete"
                                    variant="transparent"
                                    onClick={() => deleteItem(item)}
                                />
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            {newitem}
            {pagination}
        </div>)
    );
};

export default Field;
