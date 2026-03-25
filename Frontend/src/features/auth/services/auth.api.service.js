import axios from 'axios';

const api=axios.create(
    {
        baseURL: 'http://localhost:3000/api',
        withCredentials: true,
    }
)

export  async function registerUser({username, email, password}) {
    try {
        const response = await api.post('/users/register', {username, email, password});
        
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

export async function loginUser({email, password}) {
    try {
        const response = await api.post('/users/login', {email, password});
        return response.data;
    } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }
}
export async function getme() {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}
