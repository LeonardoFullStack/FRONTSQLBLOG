const express = require('express')
const app = express();
const cookieParser = require('cookie-parser')
const { consulta } = require('../helpers/dbConnect')
const {ifLogged} = require('../helpers/isLogged')
const {errorMsgs} = require('../helpers/errorMsg')


/**
 * Muestra las últimas entradas en la página de entradas.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @throws {Error} Si hay un error de conexión.
 */
const showEntries = async (req, res) => {
    const isLogged = ifLogged(req)
    const page = req.query.pag
    
    console.log('paso')

    try {
        const pageKnew = await consulta('entries/');
        const pageKnewJson = await pageKnew.json()

        const pages = Math.ceil(pageKnewJson.data.length / 4)
       

        const peticion = await consulta(`entries?pag=${page}`)
        const peticionJson = await peticion.json()
        console.log(peticionJson)

        res.render('entries', {
            title: 'Últimas entradas',
            msg: 'Consulta aqui todas las entradas',
            data: peticionJson.data,
            isLogged,
            pages
        })
    } catch (error) {
        res.render('error', {
            title: 'Error de conexión',
            msg: 'Contacta con el administrador'
        })
    }



}

const postEntry = async (req, res) => {
    const isLogged = ifLogged(req)
    res.render('post', {
        title: 'Escribe una entrada',
        msg: 'Rellena los campos',
        isLogged,
        errors:false
    })
}


/**
 * Maneja la subida de una nueva entrada.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @throws {Error} Si hay un error de conexión.
 */
const uploadEntry = async (req, res) => {

    const isLogged = ifLogged(req)
    let { email } = req.cookies
    
    const { title, extract, content,  category } = req.body
    const entryImage = req.file ? `/media/uploads/${req.file.filename}` : 'https://aeroclub-issoire.fr/wp-content/uploads/2020/05/image-not-found.jpg'; 
    
    const body = { email,entryImage, ...req.body }


    

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
                        msg:'Entrada creada con éxito!',
                        isLogged
                    })
                }else if(peticionJson.errores) {
                    const errores = errorMsgs(peticionJson.errores)
                   
                    res.render('post', {
                        title: 'Campos incorrectos',
                        msg: 'Rellena bien los campos',
                        data: body,
                        isLogged,
                        errors: true,
                        errores
                        
                    })
                } 
            } else {
               
                res.render('post', {
                    title: 'error',
                    msg: 'Ya tienes una entrada con ese título!',
                    isLogged,
                    errors:false
                })
            }


        } catch (error) {
            res.render('error', {
                title: 'error',
                msg: error,
                isLogged,
                errors:false
            })
        }
    

}


/**
 * Maneja la obtención de todas las entradas de un usuario.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @throws {Error} Si hay un error de conexión.
 */
const myEntries = async (req, res) => {
    const isLogged = ifLogged(req)
    let { email } = req.cookies
    try {
        const peticion = await consulta(`entries/?email=${email}`, 'get')
        const peticionJson = await peticion.json()
        if (peticionJson.ok) {
            res.render('myEntries', {
                title: 'Todas tus entradas',
                msg: 'Consulta, edita o elimina tus entradas',
                data: peticionJson.data,
                isLogged
            })
        } else {
            res.render('error', {
                title: 'error',
                msg: 'Error al obtener tus entradas',
                isLogged
            })
        }
    } catch (error) {
        res.render('error', {
            title: 'error',
            msg: 'Error de conexión',
            isLogged
        })
    }

}

/**
 * Maneja la búsqueda de entradas.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @param {boolean} isLogged - Indica si el usuario está autenticado.
 * @param {string} search - Término de búsqueda ingresado por el usuario.
 * @param {RegExp} pattern - Patrón de búsqueda utilizado para filtrar las entradas.
 * @param {object} finded - Entradas encontradas con la búsqueda.
 * @returns {void}
 * @throws {Error} Si hay un error de conexión.
 */
const getSearch = async (req, res) => {
    const isLogged = ifLogged(req)
    const { search } = req.body
    if (search == '') {
        res.render('search', {
            title: 'Búsqueda de entradas',
            msg: 'El campo búsqueda está vacío',
            query: false,
            isLogged
        })
    } else if (!search) {
        res.render('search', {
            title: 'Búsqueda de entradas',
            msg: 'Realiza aquí tu búsqueda',
            query: false,
            isLogged
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
                        query: false,
                        isLogged
                    })
                } else {
                    res.render('search', {
                        title: `Resultados de ${search}`,
                        msg: `Se han encontrado ${finded.length} resultados`,
                        query: true,
                        data: finded,
                        isLogged
                    })
                }


            }
        } catch (error) {
            res.render('error', {
                title: 'error',
                msg: error,
                isLogged
            })
        }



    }



}


/**
 * Maneja la edición de una entrada.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @param {boolean} isLogged - Indicador si el usuario está conectado o no.
 * @param {string} entry - Índice de la entrada a editar.
 * @param {string} email - Dirección de correo electrónico del usuario.
 * @returns {void}
 * @throws {Error} Si hay un error de conexión.
 */
const editEntry = async (req, res) => {
    const isLogged = ifLogged(req)
    const entry = req.params.indexEntry
    let { email } = req.cookies

    try {
        const allMyEntries = await consulta(`entries/one/${entry}`, 'get')
        const entriesJson = await allMyEntries.json()
        
        res.render('update', {
            title: 'Modificar  entrada',
            msg: 'Modifica aquí la entrada',
            data: entriesJson.data[0],
            isLogged
        })
    } catch (error) {
        res.render('error', {
            title: 'error',
            msg: error,
            isLogged
        })
    }


}


/**
 * Maneja la actualización de una entrada.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @param {string} req.body.title - Título de la entrada.
 * @param {string} req.body.oldTitle - Título antiguo de la entrada.
 * @param {string} req.body.extract - Extracto de la entrada.
 * @param {string} req.body.content - Contenido de la entrada.
 * @param {string} req.body.category - Categoría de la entrada.
 * @param {string} req.body.oldImage - Ruta de la imagen antigua de la entrada.
 * @param {string} req.body.email - Correo electrónico del usuario.
 * @param {string} req.file.filename - Nombre del archivo de la imagen de la entrada.
 * @returns {void}
 * @throws {Error} Si hay un error de conexión.
 */
const updateEntry = async (req, res) => {
    const isLogged = ifLogged(req)
    let { title, oldTitle, extract, content, category, oldImage } = req.body
    const { email } = req.cookies
    const entryImage = req.file ? `../media/uploads/${req.file.filename}` : oldImage; 
  
    

    if (!extract || !title || !content || !category) {
        res.render('error', {
            title: 'error de validación',
            msg: 'Rellena bien todos los campos',
            isLogged
        })


    }

    const body = {email, title,  extract, content, entryImage, category,}
     
        try {
            

                const peticion = await consulta(`entries/${oldTitle}`, 'put', body)
                const peticionJson = await peticion.json()
              
                if (peticionJson.ok) {
                    res.render('info', {
                        title:'Entrada actualizada',
                        msg:'Entrada actualizada con éxito!',
                        isLogged
                    })
                } else {
                    res.render('post', {
                        title: 'error',
                        msg: 'Error al conectar con la base de datos',
                        isLogged
                    })
                }
            


        } catch (error) {
            res.render('error', {
                title: 'error',
                msg: 'Contacta con el administrador',
                isLogged
            })
        }
    
}


/**
 * Maneja la visualización de una sola entrada.
 * 
 * @function
 * @async
 * @param {object} req - Objeto de solicitud HTTP.
 * @param {object} res - Objeto de respuesta HTTP.
 * @param {string} req.params.id - ID de la entrada a visualizar.
 * @returns {void}
 * @throws {Error} Si hay un error de conexión.
 */
const viewOne = async (req,res) => {
    const isLogged = ifLogged(req)
    const id = req.params.id
    try {
        const peticion = await consulta(`entries/one/${id}`, 'get')
        const peticionJson = await peticion.json()
       
        if (peticionJson.ok) {
            
            res.render('one', {
                title: `Entrada: ${peticionJson.data[0].title}`,
                msg: 'La entrada al completo',
                data:peticionJson.data[0],
                isLogged
            })
        } else {
            res.render('error', {
                title: 'No existe  la entrada',
                msg: 'No se ha encontrado la entrada',
                isLogged
            })
        }
    } catch (error) {
        res.render('error', {
            title: 'error',
            msg: 'Contacta con el administrador',
            error,
            isLogged
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