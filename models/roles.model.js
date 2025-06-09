const prisma = require("../database/config.db");
const roleValidation = require("../validations/role.validation");


class Roles {
    
    async getRole(req, res) {
        try {
            let findRoles = await prisma.role.findMany()
            return res.status(200).json({ data: findRoles })
        } catch (error) {
            return res.status(500).json({ error: "Unexpected error!" });
        }
    }


    async getOneRole(req, res) {
        let { id } = req.params
        try {
            let find = await prisma.role.findUnique({ where: { id } })
            if (!find) {
                return res.status(404).json({ message: "Role with this id not found" })
            }
            return res.status(200).json({ data: find })

        } catch (error) {
            return res.status(500).json({ error: "Unexpected error!" });
        }
    }


    async createRole(req, res) {
        try {
            let { error } = roleValidation(req.body)
            if (error) {
                return res.status(403).json({ message: error.message })
            }
            let { name } = req.body

            name = name.trim().toUpperCase()
            let create_role = await prisma.role.create({ data: { name } })
            return res.status(200).json({ data: create_role })
        } catch (error) {
            return res.status(500).json({ error: "Unexpected error!" ,message:error});
        }
    }


    async updateRole(req, res) {
        let { id } = req.params
        let { name } = req.body
        try {
            let { error } = roleValidation({ name })
            if (error) {
                return res.status(403).json({ message: error.message })
            }
 
            let find = await prisma.role.findUnique({ where: { id } })
            if (!find) {
                return res.status(404).json({ message: "Role with this id not found" })
            }
            let updated_user = await prisma.role.update({ where: { id },  data: { name: name.trim().toUpperCase() } })
            return res.status(200).json({ message: "Role updated successfully", data: updated_user })

        } catch (error) {
            return res.status(500).json({ error: "Unexpected error!" });
        }
    }


    async deleteRole(req, res) {
        let { id } = req.params
        try {
            let find = await prisma.role.findUnique({ where: { id } })
            if (!find) {
                return res.status(404).json({ message: "Role with this id not found" })
            }
            let delete_role = await prisma.role.delete({ where: {id} })
            return res.status(200).json({ message: "Role deleted successfully", data: delete_role })
        } catch (error) {
            return res.status(500).json({ error: "Unexpected error!" });
        }
    }
}

module.exports = new Roles()