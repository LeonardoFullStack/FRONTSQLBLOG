const express = require('express')
const app = express();
const cookieParser = require('cookie-parser')
const { consulta } = require('../helpers/dbConnect')
const bcrypt = require('bcryptjs')


app.use(cookieParser())

const getIndex = async (req, res) => {
    const { email } = req.cookies
    if (email) {
        res.redirect('/entries')
    } else {
        res.render('index', {
            title: 'TwitZerg',
            msg: 'Haz login para comenzar'
        })
    }

}

const checkLogin = async (req, res) => {
    const { email, password } = req.body

    if (email == '' || password == '') {
        res.render('index', {
            title: 'Error de validación',
            msg: 'Rellena los campos'
        })
    } else {

        try {
            const peticion = await consulta(`aut/?email=${email}`, 'get')
            const peticionJson = await peticion.json()
            
            

            if (!peticionJson.ok) {
                res.render('index', {
                    title: 'Login fallido',
                    msg: 'No hemos encontrado el usuario'
                })
            } else {
               let passwordOk = bcrypt.compareSync(password, peticionJson.data[0].password)
               if (passwordOk) {
                if (peticionJson.data[0].isadmin) {
                    
                    res.locals.isLogged = true;
                    
                    res.cookie('xtoken', peticionJson.token)
                    res.cookie('ztoken', peticionJson.tokenz)
                    res.cookie('email', `${email}`)
                    res.redirect('/admin/')
                } else {


                    
                    res.cookie('xtoken', peticionJson.token)
                    res.cookie('email', `${email}`)
                    res.redirect('/entries')
                }
               } else {
                res.render('index', {
                    title: 'Login fallido',
                    msg: 'Credenciales incorrectas'
                })
               }
                

            }
        } catch (error) {
            console.log(error)
            res.render('error', {
                title: 'error de conexión',
                msg: 'Contacta con el administrador'
            })
        }
    }


}

const logOut = (req, res) => {
    res.clearCookie('xtoken')
    res.clearCookie('ztoken')
    res.clearCookie('email');
    res.render('index', {
        title: 'Sesión cerrada',
        msg: 'Sesión cerrada con éxito, haz login para comenzar'
    })
}

const signup = async (req, res) => {
    res.render('signup', {
        title: 'Regístrate',
        msg: 'Regístrate en nuestra base de datos'
    })
}

const uploadSignup = async (req, res) => {
    const { name, surname, email, password } = req.body
    let peticionUser1, peticionUserJson1
    if (!name || !surname || !email || !password ) {
        res.render('error', {
            title: 'error de validación',
            msg: 'Rellena bien todos los campos'
        })
    } else if (password.length < 4) {
        res.render('error', {
            title: 'error de validación',
            msg: 'La contraseña debe tener 4 o más caracteres'
        })
    } else {


        const body = {
            ...req.body
        }

        try {

            peticionUser1 = await consulta(`aut/?email=${email}`, 'get')
            peticionUserJson1 = await peticionUser1.json()
            if (peticionUserJson1.ok) {
                res.render('error', {
                    title: 'error de validación',
                    msg: 'Ya hay un usuario con ese email'
                })
            } else {
                let salt = bcrypt.genSaltSync(10);
                body.password = bcrypt.hashSync(body.password, salt)

                const peticion = await consulta(`aut/`, 'post', body)
                const peticionJson = await peticion.json()
                console.log(peticionJson)

                if (peticionJson.ok) {
                    
                   
                    res.cookie('xtoken', peticionJson.token)
                    res.cookie('email', `${email}`)
                    res.redirect('/entries')

                } else {
                    res.render('error', {
                        title: 'error de registro',
                        msg: error
                    })
                }
            }


        } catch (error) {
            res.render('error', {
                title: 'error de registro',
                msg: error
            })
        }
    }

}

module.exports = {
    getIndex,
    checkLogin,
    logOut,
    signup,
    uploadSignup
}