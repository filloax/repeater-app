import React, { useEffect, useState } from 'react';
import {
    Button,
    EditorToolbarButton,
    Table,
    TableBody,
    TableRow,
    TableCell,
    TextField,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { v4 as uuid } from 'uuid';

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
        maxPageItems,
    } = props.sdk.parameters.instance as any;
    const [state, setState] = useState<{items: Item[], page: number}>({
        items: [],
        page: 0,
    });
    const { items, page } = state;

    useEffect(() => {
        // This ensures our app has enough space to render
        props.sdk.window.startAutoResizer();

        // Every time we change the value on the field, we update internal state
        props.sdk.field.onValueChanged((value: Item[]) => {
            if (Array.isArray(value)) {
                setState(prevState => ({...prevState, items: value}));
            }
        });
    }, [props.sdk.field, props.sdk.window]);

    /** Adds another item to the list */
    const addNewItem = () => {
        props.sdk.field.setValue([...items, createItem()]);
    };

    const setPage = (page: number) => {
        console.log("Set page", state);
        setState(prevState => ({...prevState, page}));
    }
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
    if (maxPageItems) {
        displayItems = displayItems.slice(page * maxPageItems, page * maxPageItems + maxPageItems)
        numPages = Math.ceil(items.length / maxPageItems)
    }

    const pagination = (maxPageItems)
        ? (<div style={{ marginTop: tokens.spacingS, marginBottom: tokens.spacingS }}>
            <Button 
                buttonType="muted"
                onClick={decPage}
                icon="ChevronLeft"
                disabled={page <= 0}
                style={{ marginRight: tokens.spacingXs }}
            ></Button> 
            <Button 
                buttonType="muted"
                style={{ margin: "0 " + tokens.spacingXs }}
                disabled={true}
            >
                {page + 1} / {numPages} {/* Display current page number */}
            </Button>
            <Button 
                buttonType="muted"
                onClick={incPage}
                icon="ChevronRight"
                disabled={page >= numPages - 1}
                style={{ marginLeft: tokens.spacingXs }}
            ></Button>
        </div>)
        : null;

    const newPage = (page === numPages - 1)
        ? (
            <Button
                buttonType="naked"
                onClick={addNewItem}
                icon="PlusCircle"
                style={{ marginTop: tokens.spacingS }}
            >
                Add Item
            </Button>
        )
        : null;

    return (
        <div>
            {pagination}
            <Table>
                <TableBody>
                    {displayItems.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <TextField
                                    id="key"
                                    name="key"
                                    labelText={keyName}
                                    value={item.key}
                                    onChange={createOnChangeHandler(item, 'key')}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    id="value"
                                    name="value"
                                    labelText={valueName}
                                    value={item.value}
                                    onChange={createOnChangeHandler(item, 'value')}
                                    textarea={multiLineValues}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <EditorToolbarButton
                                    label="delete"
                                    icon="Delete"
                                    onClick={() => deleteItem(item)}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {newPage}
            {pagination}
        </div>
    );
};

export default Field;
