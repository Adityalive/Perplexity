import {initializeSocketConnection} from "../services/chat.socket";
import {useEffect} from "react";
import { useSelector } from "react-redux";
export const Dashboard = () => {

    useEffect(() => {
        initializeSocketConnection();
    }, []);
    return (
        <div>
            <h1>Dashboard</h1>
        </div>
    );
}