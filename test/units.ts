import {isLength} from "../src/parser/utils";
import {DimensionToken} from "../src/@types";


const t = {
        typ: "Dimension",
        val: "0",
        unit: "px"
    };

    const k = {
        typ: "Number",
        val: "0"
    };

    console.debug(isLength(t));
    console.debug(t.typ == 'Number' && isLength(<DimensionToken> k));
    console.debug(k.typ == 'Number' && isLength(<DimensionToken> t));