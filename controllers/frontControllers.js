const express = require('express')
const app = express();
const cookieParser = require('cookie-parser')
const { consulta } = require('../helpers/dbConnect')

const showEntries = async (req, res) => {


    try {
        const peticion = await consulta('entries/')
        const peticionJson = await peticion.json()

        res.render('entries', {
            title: 'Últimas entradas',
            msg: 'Consulta aqui todas las entradas',
            data: peticionJson.data
        })
    } catch (error) {
        res.render('error', {
            title: 'Error de conexión',
            msg: 'Contacta con el administrador'
        })
    }



}

const postEntry = async (req, res) => {

    res.render('post', {
        title: 'Escribe una entrada',
        msg: 'Rellena los campos'
    })
}

const uploadEntry = async (req, res) => {
    let { email } = req.cookies

    const { title, extract, content, entryImage, category } = req.body
    const body = { email, ...req.body }


    if (!extract || !title || !content || !entryImage || !category) {
        res.render('post', {
            title: 'error de validación',
            msg: 'Rellena bien todos los campos'
        })
    } else {

        try {
            const allMyEntries = await consulta(`entries/?email=${email}`, 'get')
            const entriesJson = await allMyEntries.json()
            const sameEntries = entriesJson.data.filter((item) => item.title == title)

            if (sameEntries.length == 0) { //validación para no repetir entrada

                const peticion = await consulta('entries/', 'post', body)
                const peticionJson = await peticion.json()
                if (peticionJson.ok) {
                    res.render('info', {
                        title:'Entrada creada',
                        msg:'Entrada creada con éxito!'
                    })
                } else {
                    res.render('post', {
                        title: 'error',
                        msg: 'Error al conectar con la base de datos'
                    })
                }
            } else {
               
                res.render('post', {
                    title: 'error',
                    msg: 'Ya tienes una entrada con ese título!'
                })
            }


        } catch (error) {
            res.render('error', {
                title: 'error',
                msg: 'Contacta con el administrador'
            })
        }
    }

}

const myEntries = async (req, res) => {
    let { email } = req.cookies
    try {
        const peticion = await consulta(`entries/?email=${email}`, 'get')
        const peticionJson = await peticion.json()
        if (peticionJson.ok) {
            res.render('myEntries', {
                title: 'Todas tus entradas',
                msg: 'Consulta, edita o elimina tus entradas',
                data: peticionJson.data
            })
        } else {
            res.render('error', {
                title: 'error',
                msg: 'Error al obtener tus entradas'
            })
        }
    } catch (error) {
        res.render('error', {
            title: 'error',
            msg: 'Error de conexión'
        })
    }

}

const getSearch = async (req, res) => {
    const { search } = req.body
    if (search == '') {
        res.render('search', {
            title: 'Búsqueda de entradas',
            msg: 'El campo búsqueda está vacío',
            query: false
        })
    } else if (!search) {
        res.render('search', {
            title: 'Búsqueda de entradas',
            msg: 'Realiza aquí tu búsqueda',
            query: false
        })
    } else {
        try {
            const peticion = await consulta('entries/', 'get')
            const peticionJson = await peticion.json()
            
            if (peticionJson.ok) {
                let pattern = new RegExp(search, 'i')

                let finded = peticionJson.data.filter((item) => item.content.match(pattern))

                if (finded.length == 0) {
                    res.render('search', {
                        title: 'No hay resultados',
                        msg: 'No se han encontrado resultados con tu búsqueda',
                        query: false
                    })
                } else {
                    res.render('search', {
                        title: `Resultados de ${search}`,
                        msg: `Se han encontrado ${finded.length} resultados`,
                        query: true,
                        data: finded
                    })
                }


            }
        } catch (error) {
            res.render('error', {
                title: 'error',
                msg: error
            })
        }



    }



}

const editEntry = async (req, res) => {
    const entry = req.params.indexEntry
    let { email } = req.cookies

    try {
        const allMyEntries = await consulta(`entries/one/${entry}`, 'get')
        const entriesJson = await allMyEntries.json()
        
        res.render('update', {
            title: 'Modificar  entrada',
            msg: 'Modifica aquí la entrada',
            data: entriesJson.data[0]
        })
    } catch (error) {
        res.render('error', {
            title: 'error',
            msg: error
        })
    }


}

const updateEntry = async (req, res) => {
    const { title, oldTitle, extract, content, entryImage, category } = req.body
    const { email } = req.cookies
    const body = {email, ...req.body}
    if (!extract || !title || !content || !entryImage || !category) {
        res.render('error', {
            title: 'error de validación',
            msg: 'Rellena bien todos los campos'
        })


        
    } else {
        try {
            const allMyEntries = await consulta(`entries/?email=${email}`, 'get')
            const entriesJson = await allMyEntries.json()
            const sameEntries = entriesJson.data.filter((item) => item.title == title)

            if (sameEntries.length == 0) { //validación para no repetir entrada

                const peticion = await consulta(`entries/${oldTitle}`, 'put', body)
                const peticionJson = await peticion.json()
                if (peticionJson.ok) {
                    res.render('info', {
                        title:'Entrada actualizada',
                        msg:'Entrada actualizada con éxito!'
                    })
                } else {
                    res.render('post', {
                        title: 'error',
                        msg: 'Error al conectar con la base de datos'
                    })
                }
            } else {
               
                res.render('post', {
                    title: 'error',
                    msg: 'Ya tienes una entrada con ese título!'
                })
            }


        } catch (error) {
            res.render('error', {
                title: 'error',
                msg: 'Contacta con el administrador'
            })
        }
    }
}

const viewOne = async (req,res) => {
    const id = req.params.id
    try {
        const peticion = await consulta(`entries/one/${id}`, 'get')
        const peticionJson = await peticion.json()
       
        if (peticionJson.ok) {
            
            res.render('one', {
                title: `Entrada: ${peticionJson.data[0].title}`,
                msg: 'La entrada al completo',
                data:peticionJson.data[0]
            })
        } else {
            res.render('error', {
                title: 'No existe  la entrada',
                msg: 'No se ha encontrado la entrada'
            })
        }
    } catch (error) {
        res.render('error', {
            title: 'error',
            msg: 'Contacta con el administrador',
            error
        })
    }
}



module.exports = {
    showEntries,
    postEntry,
    uploadEntry,
    myEntries,
    getSearch,
    editEntry,
    updateEntry,
    viewOne
}